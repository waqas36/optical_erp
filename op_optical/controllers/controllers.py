# -*- coding: utf-8 -*-
import json
from pprint import pprint
import logging

import werkzeug
from werkzeug.exceptions import Forbidden, NotFound

# from odoo.auth_signup.models.res_partner import SignupError
from odoo.addons.auth_signup.models.res_partner import SignupError
from odoo.addons.web.controllers.main import ensure_db, Home

from odoo.addons.auth_signup.controllers.main import AuthSignupHome
from odoo.addons.web.controllers.main import ensure_db
from odoo import SUPERUSER_ID, _, fields, http, tools
from odoo.addons.base.models.ir_qweb_fields import nl2br
from odoo.addons.http_routing.models.ir_http import slug
from odoo.addons.payment.controllers.portal import PaymentProcessing
from odoo.addons.portal.controllers.portal import _build_url_w_params
from odoo.addons.website.controllers.main import QueryURL, Website
from odoo.addons.website.models.ir_http import sitemap_qs2dom
from odoo.addons.website_form.controllers.main import WebsiteForm
from odoo.addons.website_sale.controllers.main import WebsiteSale
from odoo.exceptions import ValidationError, UserError
from odoo.http import request
from odoo.osv import expression
from pprint import pprint

_logger = logging.getLogger(__name__)

class WebsiteSale(WebsiteSale):
    def _get_mandatory_fields_shipping(self, country_id=False):
        req = self._get_mandatory_shipping_fields()
        if country_id:
            country = request.env['res.country'].browse(country_id)
            if country.state_required:
                req += ['state_id']
            # if country.zip_required:
            #     req += ['zip']
        return req

class TableCompute(object):
    def __init__(self):
        self.table = {}

    def _check_place(self, posx, posy, sizex, sizey, ppr):
        res = True
        for y in range(sizey):
            for x in range(sizex):
                if posx + x >= ppr:
                    res = False
                    break
                row = self.table.setdefault(posy + y, {})
                if row.setdefault(posx + x) is not None:
                    res = False
                    break
            for x in range(ppr):
                self.table[posy + y].setdefault(x, None)
        return res

    def process(self, products, ppg=20, ppr=4):
        # Compute products positions on the grid
        minpos = 0
        index = 0
        maxy = 0
        x = 0
        for p in products:
            x = min(max(p.website_size_x, 1), ppr)
            y = min(max(p.website_size_y, 1), ppr)
            if index >= ppg:
                x = y = 1

            pos = minpos
            while not self._check_place(pos % ppr, pos // ppr, x, y, ppr):
                pos += 1
            # if 21st products (index 20) and the last line is full (ppr products in it), break
            # (pos + 1.0) / ppr is the line where the product would be inserted
            # maxy is the number of existing lines
            # + 1.0 is because pos begins at 0, thus pos 20 is actually the 21st block
            # and to force python to not round the division operation
            if index >= ppg and ((pos + 1.0) // ppr) > maxy:
                break

            if x == 1 and y == 1:  # simple heuristic for CPU optimization
                minpos = pos // ppr

            for y2 in range(y):
                for x2 in range(x):
                    self.table[(pos // ppr) + y2][(pos % ppr) + x2] = False
            self.table[pos // ppr][pos % ppr] = {
                "product": p,
                "x": x,
                "y": y,
                "ribbon": p.website_ribbon_id,
            }
            if index <= ppg:
                maxy = max(maxy, y + (pos // ppr))
            index += 1

        # Format table according to HTML needs
        rows = sorted(self.table.items())
        rows = [r[1] for r in rows]
        for col in range(len(rows)):
            cols = sorted(rows[col].items())
            x += len(cols)
            rows[col] = [r[1] for r in cols if r[1]]

        return rows


class OpConfigurator(http.Controller):
    def _get_pricelist_context(self):
        pricelist_context = dict(request.env.context)
        pricelist = False
        if not pricelist_context.get("pricelist"):
            pricelist = request.website.get_current_pricelist()
            pricelist_context["pricelist"] = pricelist.id
        else:
            pricelist = request.env["product.pricelist"].browse(
                pricelist_context["pricelist"]
            )

        return pricelist_context, pricelist

    def _get_search_order(self, post):
        # OrderBy will be parsed in orm and so no direct sql injection
        # id is added to be sure that order is a unique sort key
        order = post.get("order") or "website_sequence ASC"
        return "is_published desc, %s, id desc" % order

    def _get_search_domain(
            self, search, category, attrib_values, search_in_description=True
    ):
        domains = [request.website.sale_product_domain()]
        if search:
            for srch in search.split(" "):
                subdomains = [
                    [("name", "ilike", srch)],
                    [("product_variant_ids.default_code", "ilike", srch)],
                ]
                if search_in_description:
                    subdomains.append([("description", "ilike", srch)])
                    subdomains.append([("description_sale", "ilike", srch)])
                domains.append(expression.OR(subdomains))

        if category:
            domains.append([("public_categ_ids", "child_of", int(category))])

        if attrib_values:
            attrib = None
            ids = []
            for value in attrib_values:
                if not attrib:
                    attrib = value[0]
                    ids.append(value[1])
                elif value[0] == attrib:
                    ids.append(value[1])
                else:
                    domains.append(
                        [("attribute_line_ids.value_ids", "in", ids)])
                    attrib = value[0]
                    ids = [value[1]]
            if attrib:
                domains.append([("attribute_line_ids.value_ids", "in", ids)])

        return expression.AND(domains)

    def sitemap_shop(env, rule, qs):
        if not qs or qs.lower() in "/shop":
            yield {"loc": "/shop"}

        Category = env["product.public.category"]
        dom = sitemap_qs2dom(qs, "/shop/category", Category._rec_name)
        dom += env["website"].get_current_website().website_domain()
        for cat in Category.search(dom):
            loc = "/shop/category/%s" % slug(cat)
            if not qs or qs.lower() in loc:
                yield {"loc": loc}

    @http.route(
        [
            """/shop""",
            """/shop/page/<int:page>""",
            """/shop/category/<model("product.public.category"):category>""",
            """/shop/category/<model("product.public.category"):category>/page/<int:page>""",
        ],
        type="http",
        auth="user",
        website=True,
        sitemap=sitemap_shop,
    )
    def shop(self, page=0, category=None, search="", ppg=False, **post):

        Category = request.env["product.public.category"]
        all_categories = Category.search([('is_category_active', '=', True)])
        # all_categories = Category.search([])
        add_qty = int(post.get("add_qty", 1))

        if category:
            category = Category.search([("id", "=", int(category))], limit=1)
            if not category or not category.can_access_from_current_website():
                raise NotFound()
        else:
            category = Category

        if ppg:
            try:
                ppg = int(ppg)
                post["ppg"] = ppg
            except ValueError:
                ppg = False
        if not ppg:
            ppg = request.env["website"].get_current_website().shop_ppg or 20

        ppr = request.env["website"].get_current_website().shop_ppr or 4

        attrib_list = request.httprequest.args.getlist("attrib")
        attrib_values = [[int(x) for x in v.split("-")]
                         for v in attrib_list if v]
        attributes_ids = {v[0] for v in attrib_values}
        attrib_set = {v[1] for v in attrib_values}

        domain = self._get_search_domain(search, category, attrib_values)

        keep = QueryURL(
            "/shop",
            category=category and int(category),
            search=search,
            attrib=attrib_list,
            order=post.get("order"),
        )

        pricelist_context, pricelist = self._get_pricelist_context()

        request.context = dict(
            request.context, pricelist=pricelist.id, partner=request.env.user.partner_id
        )

        url = "/shop"
        if search:
            post["search"] = search
        if attrib_list:
            post["attrib"] = attrib_list

        Product = request.env["product.template"].with_context(bin_size=True)

        search_product = Product.search(
            domain, order=self._get_search_order(post))
        website_domain = request.website.website_domain()
        categs_domain = [("parent_id", "=", False)] + website_domain
        if search:
            search_categories = Category.search(
                [("product_tmpl_ids", "in", search_product.ids)] + website_domain
            ).parents_and_self
            categs_domain.append(("id", "in", search_categories.ids))
        else:
            search_categories = Category
        categs = Category.search(categs_domain)

        if category:
            url = "/shop/category/%s" % slug(category)

        product_count = len(search_product)
        pager = request.website.pager(
            url=url, total=product_count, page=page, step=ppg, scope=7, url_args=post
        )
        offset = pager["offset"]
        # products = search_product[offset: offset + ppg]
        products = search_product

        ProductAttribute = request.env["product.attribute"]
        if products:
            # get all products without limit
            attributes = ProductAttribute.search(
                [("product_tmpl_ids", "in", search_product.ids)]
            )
        else:
            attributes = ProductAttribute.browse(attributes_ids)

        layout_mode = request.session.get("website_sale_shop_layout_mode")
        if not layout_mode:
            if request.website.viewref("website_sale.products_list_view").active:
                layout_mode = "list"
            else:
                layout_mode = "grid"

        values = {
            "search": search,
            "category": category,
            "all_categories": all_categories,
            "attrib_values": attrib_values,
            "attrib_set": attrib_set,
            "pager": pager,
            "pricelist": pricelist,
            "add_qty": add_qty,
            "products": products,
            "search_count": product_count,  # common for all searchbox
            "bins": TableCompute().process(products, ppg, ppr),
            "ppg": ppg,
            "ppr": ppr,
            "categories": categs,
            "attributes": attributes,
            "keep": keep,
            "search_categories_ids": search_categories.ids,
            "layout_mode": layout_mode,
        }
        if category:
            values["main_object"] = category

        return request.render("op_optical.shop", values)

    @http.route(
        ['/shop/<model("product.template"):product>/conf'],
        type="http",
        auth="public",
        website=True,
        sitemap=True,
    )
    def product(self, product, category="", search="", **kwargs):
        order = request.website.sale_get_order()
        sol = request.env["sale.order.line"]
        p = request.env["product.product"]

        so_lines = sol.search([("order_id", "=", int(order.id))])

        x = None
        so_line = None
        pr = None
        for sol_ in so_lines:
            x = p.browse(sol_.product_id)
            if product.id == x.id.product_tmpl_id.id:
                pr = sol_.product_id
                so_line = sol_
        return request.render(
            "op_optical.product_configurator",
            {
                "pt": product,
                "pr": pr,
                "o": order,
                "so_lines": so_lines,
                "so_line": so_line,
            },
        )

    # @http.route(
    #     ["/shop/cart/update/prescription"],
    #     type="json",
    #     auth="public",
    #     methods=["POST"],
    #     website=True,
    # )
    # def update_prescription(self, o_line_id, **kw):
    #     ol = request.env["sale.order.line"].browse(o_line_id)
    #     if kw.get("lens_side"):
    #         ol.lens_side = kw.get("lens_side")
    #
    #     if kw.get("l_sphere"):
    #         ol.l_sphere = float(kw.get("l_sphere"))
    #     if kw.get("l_cylinder"):
    #         ol.l_cylinder = float(kw.get("l_cylinder"))
    #     if kw.get("l_axis"):
    #         ol.l_axis = float(kw.get("l_axis"))
    #     if kw.get("l_addition"):
    #         ol.l_addition = float(kw.get("l_addition"))
    #     if kw.get("l_prism1"):
    #         ol.l_prism1 = float(kw.get("l_prism1"))
    #     if kw.get("l_prism2"):
    #         ol.l_prism2 = float(kw.get("l_prism2"))
    #     if kw.get("l_base1"):
    #         ol.l_base1 = float(kw.get("l_base1"))
    #     if kw.get("l_base2"):
    #         ol.l_base2 = float(kw.get("l_base2"))
    #     if kw.get("l_diameter_id"):
    #         ol.l_diameter_id = int(kw.get("l_diameter_id"))
    #
    #     if kw.get("r_sphere"):
    #         ol.r_sphere = float(kw.get("r_sphere"))
    #     if kw.get("r_cylinder"):
    #         ol.r_cylinder = float(kw.get("r_cylinder"))
    #     if kw.get("r_axis"):
    #         ol.r_axis = float(kw.get("r_axis"))
    #     if kw.get("r_addition"):
    #         ol.r_addition = float(kw.get("r_addition"))
    #     if kw.get("r_prism1"):
    #         ol.r_prism1 = float(kw.get("r_prism1"))
    #     if kw.get("r_prism2"):
    #         ol.r_prism2 = float(kw.get("r_prism2"))
    #     if kw.get("r_base1"):
    #         ol.r_base1 = float(kw.get("r_base1"))
    #     if kw.get("r_base2"):
    #         ol.r_base2 = float(kw.get("r_base2"))
    #     if kw.get("r_diameter_id"):
    #         ol.r_diameter_id = int(kw.get("r_diameter_id"))
    #
    #     return {"status": "ok"}

    @http.route(
        ["/shop/cart/update"],
        type="json",
        auth="public",
        methods=["POST"],
        website=True,
    )
    def cart_update(self, product_id, add_qty=1, set_qty=0, **kw):
        """This route is called when adding a product to cart (no options)."""
        if not kw.get("search_pp", False):
            product_id = request.env['product.template'].sudo().browse(int(product_id)).product_variant_id.id
        else:
            if kw.get("search_pp", False):
                product_id = request.env['product.product'].sudo().browse(int(product_id)).id
                kw['search_pp'] = False
        sale_order = request.website.sale_get_order(force_create=True)
        if sale_order.state != "draft":
            request.session["sale_order_id"] = None
            sale_order = request.website.sale_get_order(force_create=True)

        product_custom_attribute_values = None
        if kw.get("product_custom_attribute_values"):
            product_custom_attribute_values = json.loads(
                kw.get("product_custom_attribute_values")
            )

        no_variant_attribute_values = None
        if kw.get("no_variant_attribute_values"):
            no_variant_attribute_values = json.loads(
                kw.get("no_variant_attribute_values")
            )

        so_line = sale_order._cart_update(
            product_id=int(product_id),
            add_qty=add_qty,
            set_qty=set_qty,
            product_custom_attribute_values=product_custom_attribute_values,
            no_variant_attribute_values=no_variant_attribute_values,
        )

        prescription = kw
        no_lines = 0
        # if prescription.get()
        ol = request.env["sale.order.line"].sudo().browse(so_line['line_id'])
        ol.type = 'lens'
        if prescription.get("is_color", False):
            ol.color_id = product_id
            ol.type = 'color'
            kw["is_color"] = False
            # kw.pop("is_color")
        if prescription.get("is_coating", False):
            line_coating_id = request.env['product.product'].sudo().browse(int(product_id)).product_tmpl_id.id
            ol.coating_id = line_coating_id
            ol.type = 'coating'
            kw["is_coating"] = False
        if prescription.get("is_uv_filter", False):
            ol.uv_filter = True
            ol.type = 'color'
            kw["is_uv_filter"] = False
        if prescription.get("is_flash_mirror", False):
            flash_mirror_id = request.env['product.template'].sudo().browse(int(product_id)).id
            ol.flash_mirror_coating_id = flash_mirror_id
            ol.type = 'coating'
            kw["is_flash_mirror"] = False
        if prescription.get("line_parent_id", False):
            ol.parent_so_line = int(prescription.get("line_parent_id", 0))
        # Assigning unit_price value to lens_price
        # ol.lens_price = ol.price_unit
        if prescription.get("product_price", False):
            ol.lens_price = float(prescription["product_price"])
            ol.price_unit = float(prescription["product_price"])
            kw['product_price'] = ''
            # self.empty_kw_args(kw['product_price'])
            # ol.price_unit = ol.lens_price + ol.price_unit
        # ****************************************
        if prescription.get("reference_number", False):
            ol.reference_number = prescription["reference_number"]
        if prescription.get("lens_side", False):
            ol.lens_side = prescription["lens_side"]
            if prescription["lens_side"] == "both":
                ol.product_uom_qty = ol.product_uom_qty + 1
            # kw['lens_side'] = ''
        if prescription.get("l_sphere", False):
            ol.l_sphere = float(prescription["l_sphere"])
            kw['l_sphere'] = ''
        if prescription.get("l_cylinder", False):
            ol.l_cylinder = float(prescription["l_cylinder"])
            kw['l_cylinder'] = ''
        if prescription.get("l_axis", False):
            ol.l_axis = float(prescription["l_axis"])
            kw['l_axis'] = ''
        if prescription.get("l_addition", False):
            ol.l_addition = float(prescription["l_addition"])
            kw['l_addition'] = ''
        if prescription.get("l_prism1", False):
            ol.l_prism1 = float(prescription["l_prism1"])
            kw['l_prism1'] = ''
        if prescription.get("l_prism2", False):
            ol.l_prism2 = float(prescription["l_prism2"])
            kw['l_prism2'] = ''
        if prescription.get("l_base1", False):
            ol.l_base1 = float(prescription["l_base1"])
            kw['l_base1'] = ''
        if prescription.get("l_base2", False):
            ol.l_base2 = float(prescription["l_base2"])
            kw['l_base2'] = ''
        if prescription.get("l_diameter_id", False):
            ol.l_diameter_id = int(prescription["l_diameter_id"])
            kw['l_diameter_id'] = ''
        if prescription.get("r_sphere", False):
            ol.r_sphere = float(prescription["r_sphere"])
            kw['r_sphere'] = ''
        if prescription.get("r_cylinder", False):
            ol.r_cylinder = float(prescription["r_cylinder"])
            kw['r_cylinder'] = ''
        if prescription.get("r_axis", False):
            ol.r_axis = float(prescription["r_axis"])
            kw['r_axis'] = ''
        if prescription.get("r_addition", False):
            ol.r_addition = float(prescription["r_addition"])
            kw['r_addition'] = ''
        if prescription.get("r_prism1", False):
            ol.r_prism1 = float(prescription["r_prism1"])
            kw['r_prism1'] = ''
        if prescription.get("r_prism2", False):
            ol.r_prism2 = float(prescription["r_prism2"])
            kw['r_prism2'] = ''
        if prescription.get("r_base1", False):
            ol.r_base1 = float(prescription["r_base1"])
            kw['r_base1'] = ''
        if prescription.get("r_base2", False):
            ol.r_base2 = float(prescription["r_base2"])
            kw['r_base2'] = ''
        if prescription.get("r_diameter_id", False):
            ol.r_diameter_id = int(prescription["r_diameter_id"])
            kw['r_diameter_id'] = ''
        # ************************* Individual Parameters ***************
        if prescription.get("r_pd", 0):
            ol.rpd = float(prescription["r_pd"])
            kw['r_pd'] = ''
        if prescription.get("l_pd", 0):
            ol.lpd = float(prescription["l_pd"])
            kw['l_pd'] = ''
        if prescription.get("bvd", 0):
            ol.bdv = float(prescription["bvd"])
            kw['bvd'] = ''
        if prescription.get("pant_a", 0):
            ol.panta = float(prescription["pant_a"])
            kw['pant_a'] = ''
        if prescription.get("ba", 0):
            ol.ba = float(prescription["ba"])
            kw['ba'] = ''
        if prescription.get("nod", 0):
            ol.nod = float(prescription["nod"])
            kw['nod'] = ''
        if prescription.get("pg_height", 0):
            ol.progression_length = int(prescription["pg_height"])
            kw['pg_height'] = ''
        # *********************** Inset ************************
        if prescription.get("right_inset", False):
            ol.r_inset = prescription["right_inset"]
            kw['right_inset'] = ''
        if prescription.get("left_inset", False):
            ol.l_inset = prescription["left_inset"]
            kw['left_inset'] = ''
        # *******************************************************
        # ***********************   COD *************************
        if prescription.get("cod_near", False):
            ol.cod_near = prescription["cod_near"]
            kw['cod_near'] = ''
        if prescription.get("cod_balance", False):
            ol.cod_balance = prescription["cod_balance"]
            kw['cod_balance'] = ''
        if prescription.get("cod_far", False):
            ol.cod_far = prescription["cod_far"]
            kw['cod_far'] = ''
        # *****************************************************
        # ************************** RLF **********************
        if prescription.get("rlf_one", 0):
            ol.rlf_a = float(prescription["rlf_one"])
            kw['rlf_one'] = ''
        if prescription.get("rlf_two", 0):
            ol.rlf_b = float(prescription["rlf_two"])
            kw['rlf_two'] = ''
        if prescription.get("rlf_three", 0):
            ol.rlf_c = float(prescription["rlf_three"])
            kw['rlf_three'] = ''
        if prescription.get("rlf_four", 0):
            ol.rlf_d = float(prescription["rlf_four"])
            kw['rlf_four'] = ''
        # ***************** Color *****************************
        if prescription.get("color_id", 0):
            # ol.color_id = prescription["color_id"]
            color_id = prescription["color_id"]
            # color_product_id = request.env['product.product'].sudo().browse(int(color_id)).product_tmpl_id.id
            kw['color_id'] = ''
            kw.update({
                'line_parent_id': ol.id
            })
            kw.update({
                'is_color': True
            })
            kw.update({
                'search_pp': True
            })
            self.cart_update(color_id, add_qty=0, set_qty=0, **kw)
            # ol.color_id = color_product_id
            return
        if prescription.get("color_price", 0):
            ol.color_price = float(prescription["color_price"])
            ol.price_unit = ol.color_price
            kw['color_price'] = ''
            # ol.price_unit = ol.color_price + ol.price_unit
        # *****************************************************
        # **************** Coating ****************************
        if prescription.get("coating_id", 0):
            # ol.coating_id = prescription["coating_id"]
            coating_id = prescription["coating_id"]
            kw['coating_id'] = ''
            # coating_product_id = request.env['product.template'].sudo().browse(int(coating_id)).product_variant_id.id
            if not prescription.get("line_parent_id", 0):
                kw.update({
                    'line_parent_id': ol.id
                })
            kw.update({
                'is_coating': True
            })
            self.cart_update(coating_id, add_qty=0, set_qty=0, **kw)
            return
        if prescription.get("coating_price", 0):
            ol.coating_price = float(prescription["coating_price"])
            ol.price_unit = ol.coating_price
            kw['coating_price'] = ''
            # ol.price_unit = ol.coating_price + ol.price_unit
        # ******************************************************
        if prescription.get("uv_filter", False):
            # ol.uv_filter = prescription["uv_filter"]
            uv_filter_id = prescription["uv_filter_id"]
            kw['uv_filter_id'] = ''
            kw['uv_filter'] = False
            if not prescription.get("line_parent_id", 0):
                kw.update({
                    'line_parent_id': ol.id
                })
            kw.update({
                'is_uv_filter': True
            })
            # uv_product_id = request.env['product.template'].sudo().browse(int(uv_filter_id)).product_variant_id.id
            self.cart_update(uv_filter_id, add_qty=0, set_qty=0, **kw)
            return
        if prescription.get("uv_price", 0):
            ol.uv_price = float(prescription["uv_price"])
            kw['uv_price'] = ''
            ol.price_unit = ol.uv_price
            # ol.price_unit = ol.price_unit + ol.uv_price
        if prescription.get("flash_mirror_coating", False):
            # ol.flash_mirror_coating_id = prescription["flash_mirror_coating"]
            flash_coating_id = prescription["flash_mirror_coating"]
            # flash_product = request.env['product.product'].sudo().browse(int(flash_coating_id)).product_tmpl_id.id
            kw['flash_mirror_coating'] = ''
            if not prescription.get("line_parent_id", 0):
                kw.update({
                    'line_parent_id': ol.id
                })
            kw.update({
                'is_flash_mirror': True
            })
            kw.update({
                'search_pp': True
            })
            self.cart_update(flash_coating_id, add_qty=0, set_qty=0, **kw)
            return
        if prescription.get("flash_mirror_coating_price", 0):
            ol.flash_mirror_coating_price = float(prescription["flash_mirror_coating_price"])
            ol.price_unit = ol.flash_mirror_coating_price
            kw['flash_mirror_coating_price'] = ''
            # ol.price_unit = ol.price_unit + ol.flash_mirror_coating_price
        # *****************************************************

        return {"status": "ok"}

    @http.route(["/find_product_colour"], type="json", auth="public", methods=["POST"], website=True, )
    def update_colour_date(self, **kw):
        product_id = request.env['product.template'].sudo().browse(kw['product_id'])
        if product_id.color_ids:
            color_data = self.get_color_variant_dictionary(product_id.color_ids)
        if product_id.coating_ids:
            coating_data = self.get_coating_variant_dictionary(product_id)
        if product_id.color_ids and product_id.coating_ids:
            return {"color_data": color_data, "coating_data": coating_data}
        if product_id.color_ids:
            return {"color_data": color_data}
        if product_id.coating_ids:
            return {"coating_data": coating_data}
        if not product_id.color_ids and not product_id.coating_ids:
            return

    def get_color_variant_dictionary(self, color_product_ids):
        colors = []
        for color_product_tmp in color_product_ids:
            color_list = []
            for product in color_product_tmp.product_variant_ids:
                price_list_dic = self.get_variants_price_list(product)
                price_list_price = price_list_dic.get('converted_price', 0)
                color_list.append({
                    'id': product.id,
                    'name': product.product_template_attribute_value_ids[0].name if len(
                        product.product_template_attribute_value_ids) else product.name,
                    'image': product.image_1920,
                    'price': "{:.2f}".format(float(price_list_price)),
                    # 'price': round(price_list_dic.get('converted_price'), 2),
                })
            price_list_dic = self.get_variants_price_list(color_product_tmp)
            price_list_price = price_list_dic.get('converted_price', 0)
            colors.append({
                "name": color_product_tmp.name,
                "image": color_product_tmp.image_1920,
                "price": "{:.2f}".format(float(price_list_price)),
                # "price": round(price_list_dic.get('converted_price'), 2),
                "color_list": color_list,
                "id": color_product_tmp.id,
                "currency_symbol": price_list_dic.get('symbol'),
            })
        return colors

    def get_coating_variant_dictionary(self, product_id):
        list = []
        for val in product_id.coating_ids:
            dic = {}
            coating_list = []
            if not val.attribute_line_ids:
                price_list_dic = self.get_variants_price_list(val)
                price_list_price = price_list_dic.get('converted_price', 0)
                coating_list.append({
                    'name': val.name,
                    'image': val.image_1920,
                    'price': "{:.2f}".format(float(price_list_price)),
                    # 'price': round(price_list_dic.get('converted_price'), 2),
                })
            elif val.attribute_line_ids[0]:
                for product in val.product_variant_ids:
                    price_list_dic = self.get_variants_price_list(product)
                    price_list_price = price_list_dic.get('converted_price', 0)
                    coating_list.append({
                        'id': product.id,
                        'name': product.product_template_attribute_value_ids[0].name if len(
                            product.product_template_attribute_value_ids) else product.name,
                        'image': product.image_1920,
                        'price': "{:.2f}".format(float(price_list_price)),
                        # 'price': round(price_list_dic.get('converted_price'), 2),
                    })
            price_list_dic = self.get_variants_price_list(val)
            price_list_price = price_list_dic.get('converted_price', 0)
            list.append({
                'name': val.name,
                'coating_list': coating_list,
                'price': "{:.2f}".format(float(price_list_price)),
                # 'price': round(price_list_dic.get('converted_price'), 2),
                'image': val.image_1920,
                'id': val.id,
                'currency_symbol': price_list_dic.get('symbol'),
            })
            # list.append([val.name, coating_list, val.id])
        return list

    def get_variants_price_list(self, product_variant):
        if request.env.user.partner_id.parent_id:
            currency_id = request.env.user.partner_id.parent_id.property_product_pricelist.currency_id
        else:
            currency_id = request.env.user.partner_id.property_product_pricelist.currency_id
        if product_variant.currency_id != currency_id:
            return {
                'converted_price': "{:.2f}".format(currency_id.rate * product_variant.lst_price),
                # 'converted_price': round(currency_id.rate * product_variant.lst_price, 2),
                'symbol': currency_id.symbol,
            }
        else:
            return {
                'converted_price': "{:.2f}".format(product_variant.lst_price),
                # 'converted_price': float(product_variant.lst_price),
                'symbol': currency_id.symbol,
            }

        #         color_values_list.append({"value": color_values.name})
        #     product_color_data.append({"id": color_id.id,
        #                                "name": color_id.name,
        #                                "price": color_id.color_price,
        #                                "color_list": color_name_list,
        #                                "color_value": color_values_list,
        #                                "description": color_id.description})
        #
        # return {"color_data": product_color_data, "coating_data": product_coating_data}

    @http.route(["/find_products"], type="json", auth="public", methods=["POST"], website=True, )
    def update_prescription(self, **kw):
        print(kw)

        lens_side = "Both"
        r_sphere = kw.get("r_sphere")
        r_cylinder = kw.get("r_cylinder")
        r_axis = kw.get("r_axis")
        r_addition = kw.get("r_addition")
        r_pupil_distance = kw.get("r_pupil_distance")

        l_sphere = kw.get("l_sphere")
        l_cylinder = kw.get("l_cylinder")
        l_axis = kw.get("l_axis")
        l_addition = kw.get("l_addition")
        l_pupil_distance = kw.get("l_pupil_distance")

        product_category = kw.get("product_category")

        domains = []
        if r_sphere:
            domains.append(('sphere_range_min', '<=', r_sphere))
            domains.append(('sphere_range_max', '>=', r_sphere))
        if l_sphere:
            domains.append(('sphere_range_min', '<=', l_sphere))
            domains.append(('sphere_range_max', '>=', l_sphere))

        if r_cylinder:
            domains.append(('cylinder_range_min', '<=', r_cylinder))
            domains.append(('cylinder_range_max', '>=', r_cylinder))
        if l_cylinder:
            domains.append(('cylinder_range_min', '<=', l_cylinder))
            domains.append(('cylinder_range_max', '>=', l_cylinder))

        # if r_axis:
        #     domains.append(('axis_range_min', '<=', r_axis))
        #     domains.append(('axis_range_max', '>=', r_axis))
        # if l_axis:
        #     domains.append(('axis_range_min', '<=', l_axis))
        #     domains.append(('axis_range_max', '>=', l_axis))

        if r_addition:
            domains.append(('additional_range_min', '<=', r_addition))
            domains.append(('additional_range_max', '>=', r_addition))
        if l_addition:
            domains.append(('additional_range_min', '<=', l_addition))
            domains.append(('additional_range_max', '>=', l_addition))

        # if r_pupil_distance:
        #     domains = [('rpd_min', '<=', r_pupil_distance), ('rpd_max', '>=', r_pupil_distance)]
        #     r_sphere = 0
        #     r_cylinder = 0
        #     r_axis = 0
        #     r_addition = 0
        #
        # if l_pupil_distance:
        #     r_sphere = 0
        #     r_cylinder = 0
        #     r_axis = 0
        #     r_addition = 0
        #     l_sphere = 0
        #     l_cylinder = 0
        #     l_addition = 0
        #     if r_pupil_distance:
        #         domains.append(('lpd_min', '<=', l_pupil_distance))
        #         domains.append(('lpd_max', '>=', l_pupil_distance))
        #     else:
        #         domains = [('rpd_min', '<=', r_pupil_distance), ('rpd_max', '>=', r_pupil_distance)]

        if product_category:
            domains.append(
                ("public_categ_ids", "child_of", int(product_category)))

        if r_sphere or r_cylinder or r_addition or l_sphere or l_cylinder or l_addition:
            if product_category:
                r_sphere = r_cylinder = r_addition = l_sphere = l_cylinder = l_addition = r_axis = 0
                # l_pupil_distance = r_pupil_distance = 0
                domains = [("public_categ_ids", "child_of", int(product_category))]
            # if not product_category:
            #     product_obj = request.env["product.template"].with_context(
            #         bin_size=True)
            #     search_product = product_obj.search(domains)
            else:
                product_obj = request.env["optometrist.product.diameter"].sudo().with_context(
                    bin_size=True)
                search_product = product_obj.search(domains).product_id

        if not r_sphere and not r_cylinder and not r_axis and not r_addition and not l_sphere and not l_cylinder and not l_addition:
            product_obj = request.env["product.template"].sudo().with_context(
                bin_size=True)
            search_product = product_obj.search(domains)

        # if l_pupil_distance or r_pupil_distance:
        #     product_obj = request.env["product.template"].with_context(
        #         bin_size=True)
        #     search_product = product_obj.search(domains)

        products = []
        for pr in search_product:
            if pr.product_type == 'color' or pr.product_type == 'coating' or not pr.sale_ok:
                pass
            else:
                dioptre_option = []
                for d in pr.dioptre_option_ids:
                    dioptre_option.append({'id': d.id, 'name': d.name})

                diameter_option = []
                for d in pr.diameter_option_ids:
                    diameter_option.append({'id': d.id, 'name': d.name})

                progression_length_option = []
                for d in pr.progression_length_ids:
                    progression_length_option.append({'id': d.id, 'name': d.name})

                converted_price = self.get_price_list(pr)
                products.append({'name': pr.name,
                                 'id': pr.id,
                                 'code': pr.lens_code,
                                 'edi_code': pr.edi_code,
                                 'price': "{:.2f}".format(converted_price),
                                 # 'price': round(converted_price, 2),
                                 'product_type': pr.product_type,
                                 'is_color': pr.is_color,
                                 'is_coating': pr.is_coating,
                                 'is_single_lens_sellable': pr.is_single_lens_sellable,
                                 'is_customisable': pr.is_customisable,
                                 'sphere_range_min': pr.sphere_range_min,
                                 'sphere_range_max': pr.sphere_range_max,
                                 'cylinder_range_min': pr.cylinder_range_min,
                                 'cylinder_range_max': pr.cylinder_range_max,
                                 'axis_range_min': pr.axis_range_min,
                                 # 'axis_range_max': pr.axis_range_max,
                                 'axis_range_max': 180,
                                 'additional_range_min': pr.additional_range_min,
                                 'additional_range_max': pr.additional_range_max,
                                 'can_configure_prism': pr.can_configure_prism,
                                 'prism1_range_min': pr.prism1_range_min,
                                 'prism1_range_max': pr.prism1_range_max,
                                 'prism2_range_min': pr.prism2_range_min,
                                 'prism2_range_max': pr.prism2_range_max,
                                 'base1_range_min': pr.base1_range_min,
                                 'base1_range_max': pr.base1_range_max,
                                 'base2_range_min': pr.base2_range_min,
                                 'base2_range_max': pr.base2_range_max,
                                 'spherometer_dpt_min': pr.spherometer_dpt_min,
                                 'spherometer_dpt_std': pr.spherometer_dpt_std,
                                 'spherometer_dpt_max': pr.spherometer_dpt_max,
                                 'individual_parameter_configurable': pr.individual_parameter_configurable,
                                 'is_lpd': pr.is_lpd,
                                 'is_rpd': pr.is_rpd,
                                 'is_bvd': pr.is_bvd,
                                 'is_pant_a': pr.is_pant_a,
                                 'is_ba': pr.is_ba,
                                 'is_nod': pr.is_nod,
                                 'is_progression_length': pr.is_progression_length,
                                 'lpd_min': pr.lpd_min,
                                 'lpd_max': pr.lpd_max,
                                 'lpd_std': pr.lpd_std,
                                 'rpd_min': pr.rpd_min,
                                 'rpd_max': pr.rpd_max,
                                 'rpd_std': pr.rpd_std,
                                 'bvd_min': pr.bvd_min,
                                 'bvd_max': pr.bvd_max,
                                 'bvd_std': pr.bvd_std,
                                 'panta_min': pr.panta_min,
                                 'panta_max': pr.panta_max,
                                 'panta_std': pr.panta_std,
                                 'ba_min': pr.ba_min,
                                 'ba_max': pr.ba_max,
                                 'ba_std': pr.ba_std,
                                 'nod_min': pr.nod_min,
                                 'nod_max': pr.nod_max,
                                 'nod_std': pr.nod_std,
                                 'dioptre_option': dioptre_option,
                                 'diameter_option': diameter_option,
                                 'progression_length_option': progression_length_option,
                                 'url': pr.website_url,
                                 'is_cod': pr.is_cod,
                                 'is_rlf': pr.is_rlf,
                                 'is_dpt_two': pr.is_dpt_two,
                                 'is_inset': pr.is_inset,
                                 })
        user_name = request.env.user.name
        if request.env.user.partner_id.parent_id:
            currency_symbol = request.env.user.partner_id.parent_id.property_product_pricelist.currency_id.symbol
        else:
            currency_symbol = request.env.user.partner_id.property_product_pricelist.currency_id.symbol
        # currency_symbol = ""

        return {'products': products,
                'currency_symbol': currency_symbol,
                'user_name': user_name
                }

    def get_price_list(self, product):
        if request.env.user.partner_id.parent_id:
            currency_id = request.env.user.partner_id.parent_id.property_product_pricelist.currency_id
        else:
            currency_id = request.env.user.partner_id.property_product_pricelist.currency_id
        if product.currency_id != currency_id:
            return currency_id.rate * product.list_price
        else:
            return product.list_price


    @http.route(["/get_diameter"], type="json", auth="public", methods=["POST"], website=True, )
    def get_daimeter(self, **kw):
        line = request.env["optometrist.product.diameter"].sudo().browse(kw.get("id"))

        return {"cylinder_range_max": line.cylinder_range_max,
                "cylinder_range_min": line.cylinder_range_min,
                "sphere_range_max": line.sphere_range_max,
                "sphere_range_min": line.sphere_range_min,
                "additional_range_max": line.additional_range_max,
                "additional_range_min": line.additional_range_min,
                "prism_range_min": line.prism_range_min,
                "prism_range_max": line.prism_range_max
                }

    # ************************ SIGNUP Controller ***********************************************


class AuthSignupHome(Home):

    @http.route()
    def web_login(self, *args, **kw):
        ensure_db()
        response = super(AuthSignupHome, self).web_login(*args, **kw)
        response.qcontext.update(self.get_auth_signup_config())
        if request.httprequest.method == 'GET' and request.session.uid and request.params.get('redirect'):
            # Redirect if already logged in and redirect param is present
            return http.redirect_with_hash(request.params.get('redirect'))
        return response

    @http.route('/web/signup', type='http', auth='public', website=True, sitemap=False)
    def web_auth_signup(self, *args, **kw):
        # qcontext = self.get_auth_signup_qcontext()
        qcontext = request.params.copy()
        countries = request.env['res.country'].sudo().search([])

        if kw:
            if qcontext.get('token'):
                User = request.env['res.users']
                user_sudo = User.sudo().search(
                    User._get_login_domain(qcontext.get('login')), order=User._get_login_order(), limit=1
                )
                template = request.env.ref('auth_signup.mail_template_user_signup_account_created',
                                           raise_if_not_found=False)
                if user_sudo and template:
                    template.sudo().send_mail(user_sudo.id, force_send=True)
                return self.web_login(*args, **kw)
            current_partner = False
            user_request = False
            if kw.get('login', False):
                current_partner = request.env['res.partner'].sudo().search([('email', '=', kw.get('login', None))], limit=1)
                user_request = request.env['user.request'].sudo().search([('email', '=', kw.get('login', None))], limit=1)
            if current_partner:
                raise UserError(_("User already Exist"))
            if user_request:
                return request.render("op_optical.user_request_exist", {})
            else:
                company_name = request.env['res.partner'].sudo().search(['&', ('name', '=', kw.get('company_name', False)),
                                                                         ('company_type', '=', 'company')], limit=1)
                price_list = request.env['product.pricelist'].sudo().search(
                    ['&', ('name', '=', kw.get('pricelist', None)), ('website_id', '=', 1)], limit=1)
                if not company_name or company_name.name == current_partner.name:
                    company_name = request.env['res.partner'].sudo().create({
                        # 'name': company_name.name,
                        'name': kw.get('company_name', None),
                        'company_type': 'company',
                        'property_product_pricelist': price_list.id,
                    })
                else:
                    company_name = request.env['res.partner'].sudo().create({
                        'name': company_name.name,
                        'company_type': 'company',
                        'property_product_pricelist': price_list.id,
                    })
                company_name = request.env['res.partner'].sudo().create({
                    'name': kw.get('name', None),
                    'parent_id': company_name.id,
                    'company_type': 'person',
                    'email': kw.get('login', None),
                    'type': 'contact',
                    'street': kw.get('street', None),
                    'city': kw.get('city', None),
                    'zip': kw.get('zip_code', None),
                    'country_id': int(kw.get('country_id', None)),
                    'vat': kw.get('vat_number', None),
                    'phone': kw.get('phone', None),
                    'property_product_pricelist': price_list.id,
                    'active': False,
                })
                country_name = request.env['res.country'].sudo().search([('id', '=', kw['country_id'])], limit=1).name
                request.env['user.request'].sudo().create({
                    'name': kw.get('name', None),
                    'email': kw.get('login', None),
                    'company': company_name.name,
                    'street': kw.get('street', None),
                    'city': kw.get('city', None),
                    'zip_code': kw.get('zip_code', None),
                    'country': country_name,
                    'vat_number': kw.get('vat_number', None),
                    'phone': kw.get('phone', None),
                    'pricelist': price_list.id,
                    'password': kw.get('confirm_password', None),
                })
                return request.redirect('/contactus-thank-you')
        qcontext.update({
            'countries': countries
        })
        response = request.render('auth_signup.signup', qcontext)
        response.headers['X-Frame-Options'] = 'DENY'
        return response

    # if not qcontext.get('token') and not qcontext.get('signup_enabled'):
    #     raise werkzeug.exceptions.NotFound()

    # if 'error' not in qcontext and request.httprequest.method == 'POST':
    #     try:
    #         # self.do_signup(qcontext)
    #
    #         if current_partner:
    #             company_name = request.env['res.partner'].sudo().search(['&', ('name', '=', kw['company_name']),
    #                                                                      ('company_type', '=', 'company')], limit=1)
    #             if not company_name or company_name.name == current_partner.name:
    #                 company_name = request.env['res.partner'].sudo().create({
    #                     # 'name': company_name.name,
    #                     'name': kw['company_name'],
    #                     'company_type': 'company'
    #                 })
    #             else:
    #                 company_name = request.env['res.partner'].sudo().create({
    #                     'name': company_name.name,
    #                     'company_type': 'company'
    #                 })
    #             current_partner.sudo().parent_id = company_name.id
    #             current_partner.sudo().company_type = 'person'
    #             current_partner.sudo().email = kw['login']
    #             current_partner.sudo().type = 'contact'
    #             current_partner.sudo().street = kw['street']
    #             current_partner.sudo().city = kw['city']
    #             current_partner.sudo().zip = kw['zip_code']
    #             current_partner.sudo().country_id = int(kw['country_id'])
    #             current_partner.sudo().vat = kw['vat_number']
    #             current_partner.sudo().phone = kw['phone']
    #             # inactive current partner
    #             request.env.cr.execute("""UPDATE res_partner SET active=False WHERE id=%s""" % current_partner.id)
    #             # current_partner.sudo().user_ids.active_partner = False
    #             # current_user = request.env['res.users'].search([])
    #             # current_user.sudo().active = False
    #             # inactive current partner
    #             # current_partner.sudo().active = False
    #
    #             request.env['user.request'].sudo().create({
    #                 'name': kw['name'],
    #                 'email': kw['login'],
    #                 'company': company_name.id,
    #                 'street': kw['street'],
    #                 'city': kw['city'],
    #                 'zip_code': kw['zip_code'],
    #                 'country': kw['country_id'],
    #                 'vat_number': kw['vat_number'],
    #                 'phone': kw['phone'],
    #             })
    #         # Send an account creation confirmation email
    #         if qcontext.get('token'):
    #             User = request.env['res.users']
    #             user_sudo = User.sudo().search(
    #                 User._get_login_domain(qcontext.get('login')), order=User._get_login_order(), limit=1
    #             )
    #             template = request.env.ref('auth_signup.mail_template_user_signup_account_created',
    #                                        raise_if_not_found=False)
    #             if user_sudo and template:
    #                 template.sudo().send_mail(user_sudo.id, force_send=True)
    #         # return self.web_login(*args, **kw)
    #     except UserError as e:
    #         qcontext['error'] = e.args[0]
    #     except (SignupError, AssertionError) as e:
    #         if request.env["res.users"].sudo().search([("login", "=", qcontext.get("login"))]):
    #             qcontext["error"] = _("Another user is already registered using this email address.")
    #         else:
    #             _logger.error("%s", e)
    #             qcontext['error'] = _("Could not create a new account.")
    # qcontext.update({
    #     'countries': countries
    # })
    # response = request.render('auth_signup.signup', qcontext)
    # response.headers['X-Frame-Options'] = 'DENY'
    # return response


def get_auth_signup_qcontext(self):
    """ Shared helper returning the rendering context for signup and reset password """
    qcontext = request.params.copy()
    qcontext.update(self.get_auth_signup_config())
    if not qcontext.get('token') and request.session.get('auth_signup_token'):
        qcontext['token'] = request.session.get('auth_signup_token')
    if qcontext.get('token'):
        try:
            # retrieve the user info (name, login or email) corresponding to a signup token
            token_infos = request.env['res.partner'].sudo().signup_retrieve_info(qcontext.get('token'))
            for k, v in token_infos.items():
                qcontext.setdefault(k, v)
        except:
            qcontext['error'] = _("Invalid signup token")
            qcontext['invalid_token'] = True
    return qcontext


def get_auth_signup_config(self):
    """retrieve the module config (which features are enabled) for the login page"""

    get_param = request.env['ir.config_parameter'].sudo().get_param
    return {
        'signup_enabled': request.env['res.users']._get_signup_invitation_scope() == 'b2c',
        'reset_password_enabled': get_param('auth_signup.reset_password') == 'True',
    }


def do_signup(self, qcontext):
    """ Shared helper that creates a res.partner out of a token """
    values = {key: qcontext.get(key) for key in ('login', 'name', 'password')}
    if not values:
        raise UserError(_("The form was not properly filled in."))
    if values.get('password') != qcontext.get('confirm_password'):
        raise UserError(_("Passwords do not match; please retype them."))
    # supported_lang_codes = [code for code, _ in request.env['res.lang'].get_installed()]
    # lang = request.context.get('lang', '')
    # if lang in supported_lang_codes:
    #     values['lang'] = lang
    # self._signup_with_values(qcontext.get('token'), values)
    # request.env.cr.commit()


def _signup_with_values(self, token, values):
    db, login, password = request.env['res.users'].sudo().signup(values, token)
    request.env.cr.commit()  # as authenticate will use its own cursor we need to commit the current transaction
    uid = request.session.authenticate(db, login, password)
    if not uid:
        raise SignupError(_('Authentication Failed.'))
