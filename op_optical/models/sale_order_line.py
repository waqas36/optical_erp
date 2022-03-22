# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
import json

from odoo.tools import formatLang


class OptometristPrescriptionSaleOrderLineConfigurator(models.Model):
    _inherit = "sale.order.line"
    _description = "Optometrist Prescription Order Line"

    lens_side = fields.Selection(
        [("both", "Both"), ("left", "Left"), ("right", "Right")],
        string="Lens Side",
        default="both",
        required=True,
    )

    dioptre_id = fields.Many2one(
        comodel_name="optometrist.product.dioptre", string="Dioptre"
    )

    l_sphere = fields.Float(string="Lt. Sphere")
    l_cylinder = fields.Float(string="Lt. Cylinder")
    l_axis = fields.Float(string="Lt. Axis")
    l_addition = fields.Float(string="Lt. Addition")
    l_prism1 = fields.Float(string="Lt. Prism1")
    l_prism2 = fields.Float(string="Lt. Prism2")
    l_base1 = fields.Float(string="Lt. Base1")
    l_base2 = fields.Float(string="Lt. Base2")

    order_id = fields.Many2one('sale.order', string='Order Reference', required=True, ondelete='cascade', index=True,
                               copy=False)
    company_id = fields.Many2one(related='order_id.company_id', string='Company', store=True, readonly=True, index=True)
    product_id = fields.Many2one(
        'product.product', string='Product',
        domain="[('sale_ok', '=', True), '|', ('company_id', '=', False), ('company_id', '=', company_id)]",
        change_default=True, ondelete='restrict', check_company=True)  # Unrequired company
    product_template_id = fields.Many2one(
        'product.template', string='Product Template',
        related="product_id.product_tmpl_id", domain=[('sale_ok', '=', True)])

    l_diameter_id = fields.Many2one("optometrist.product.diameter",
                                    string="Lt. Diameter",
                                    domain="[('product_id', '=', product_template_id)]", required=False
                                    )

    l_spherometer_dpt = fields.Float(string="Lt. Base curve in spherometer")

    r_sphere = fields.Float(string="Rt. Sphere")
    r_cylinder = fields.Float(string="Rt. Cylinder")
    r_axis = fields.Float(string="Rt. Axis")
    r_addition = fields.Float(string="Rt. Addition")
    r_prism1 = fields.Float(string="Rt. Prism1")
    r_prism2 = fields.Float(string="Rt. Prism2")
    r_base1 = fields.Float(string="Rt. Base1")
    r_base2 = fields.Float(string="Rt. Base2")
    r_diameter_id = fields.Many2one(
        comodel_name="optometrist.product.diameter", string="Rt. Diameter",
        domain="[('product_id', '=', product_template_id)]", required=False
    )
    r_spherometer_dpt = fields.Float(string="Rt. Base curve in spherometer")

    lpd = fields.Float(string="Left Pupil Distance")
    rpd = fields.Float(string="Right Pupil Distance")
    bdv = fields.Float(string="Back Vertex Distance")
    panta = fields.Float(string="Pantoscopic Tilt")
    ba = fields.Float(string="Frame Angle")
    nod = fields.Float(string="Near Object Distance")
    cod = fields.Float(string="Consumer Oriented Design")
    r_inset = fields.Char(string="Right Inset")
    l_inset = fields.Char(string="Left Inset")
    channel_length = fields.Float(string="Channel Length")
    progression_length = fields.Many2one(
        "optometrist.product.progression_length", string="Progression Length"
    )

    is_individual_parameter_configurable = fields.Boolean(
        string="Individual Parameter Configurable",
        compute="_compute_if_individual_parameter_configurable",
    )

    rlf_a = fields.Float(string="RLF A (0.37)")
    rlf_b = fields.Float(string="RLF B (0.62)")
    rlf_c = fields.Float(string="RLF C (0.87)")
    rlf_d = fields.Float(string="RLF D (1.12)")

    cod_near = fields.Boolean(string="near (N)")
    cod_balance = fields.Boolean(string="balance (B)")
    cod_far = fields.Boolean(string="far (F)")

    type = fields.Selection(string='Product Type', selection=[
        ('lens', 'Lens'),
        ('color', 'Color'),
        ('coating', 'Coating'),
    ])

    parent_so_line = fields.Many2one('sale.order.line', string="Parent Line")

    is_lpd = fields.Boolean(string="Add Left PD", default=False)
    is_rpd = fields.Boolean(string="Add Right PD", default=False)
    is_bvd = fields.Boolean(string="Add BVD", default=False)
    is_pant_a = fields.Boolean(string="Add PantA", default=False)
    is_ba = fields.Boolean(string="Add BA", default=False)
    is_nod = fields.Boolean(string="Add NOD", default=False)
    is_progression_length = fields.Boolean(string="Add Progression Length", default=False)
    is_dpt_two = fields.Boolean(string="Add Dpt +0.01", default=False)
    is_inset = fields.Boolean(string="Add Inset", default=False)
    is_cod = fields.Boolean(string="Add COD", default=False)
    is_rlf = fields.Boolean(string="Add RLF", default=False)

    color_ids_domain = fields.Char(compute="_get_color_ids", readonly=True, store=False)
    coating_ids_domain = fields.Char(compute="_get_coating_ids", readonly=True, store=False)
    # flash_ids_domain = fields.Char(compute="_get_flash_ids", readonly=True, store=False)

    color_id = fields.Many2one('product.product', string="Color", domain=[('product_type', '=', 'color')])
    uv_filter = fields.Boolean(string="UV Filter", default=False)
    coating_id = fields.Many2one('product.template', string="Coating", domain=[('product_type', '=', 'coating')])
    is_coating = fields.Boolean("Is Coating", default=False)
    flash_mirror_coating_id = fields.Many2one('product.product', string="Flash Mirror Coating",
                                              domain=[('name', '=', 'Flash Mirror Coating')])
    is_flash_mirror = fields.Boolean("Is Flash Mirror Coating", default=False)
    add_flash_mirror = fields.Boolean("Add Flash Mirror Coating", default=False)

    @api.onchange('add_flash_mirror')
    def _onchange_add_flash_mirror(self):
        if self.add_flash_mirror:
            self.is_coating = False
            # self.coating_id = ''
        else:
            self.is_coating = True
            # self.flash_mirror_coating_id = ''

    @api.depends('product_id')
    def _get_color_ids(self):
        color_ids = self.product_id.product_tmpl_id.color_ids.product_variant_ids
        color_list = []
        for color in color_ids:
            color_list.append(color.id)
        self.color_ids_domain = json.dumps([('id', 'in', color_list)])

    @api.depends('product_id')
    def _get_coating_ids(self):
        self.is_flash_mirror = False
        coating_ids = self.product_id.product_tmpl_id.coating_ids
        coating_list = []
        if coating_ids:
            self.is_coating = True
        for coating in coating_ids:
            if coating.name == "Flash Mirror Coating":
                self.is_flash_mirror = True
            else:
                coating_list.append(coating.id)
        self.coating_ids_domain = json.dumps([('id', 'in', coating_list)])

    def _compute_if_individual_parameter_configurable(self):
        self.is_individual_parameter_configurable = True
        # self.is_individual_parameter_configurable = (
        #     self.product_template_id.individual_parameter_configurable
        # )

    @api.onchange("product_id")
    def onchange_product_id(self):
        # if self.product_id.individual_parameter_configurable:
        if self.product_id.is_lpd:
            self.is_lpd = True
        else:
            self.is_lpd = False
        if self.product_id.is_rpd:
            self.is_rpd = True
        else:
            self.is_rpd = False
        if self.product_id.is_bvd:
            self.is_bvd = True
        else:
            self.is_bvd = False
        if self.product_id.is_pant_a:
            self.is_pant_a = True
        else:
            self.is_pant_a = False
        if self.product_id.is_ba:
            self.is_ba = True
        else:
            self.is_ba = False
        if self.product_id.is_nod:
            self.is_nod = True
        else:
            self.is_nod = False
        if self.product_id.is_progression_length:
            self.is_progression_length = True
        else:
            self.is_progression_length = False
        if self.product_id.is_dpt_two:
            self.is_dpt_two = True
        else:
            self.is_dpt_two = False
        if self.product_id.is_inset:
            self.is_inset = True
        else:
            self.is_inset = False
        if self.product_id.is_cod:
            self.is_cod = True
        else:
            self.is_cod = False
        if self.product_id.is_rlf:
            self.is_rlf = True
        else:
            self.is_rlf = False
        if self.product_id.product_type:
            self.type = self.product_id.product_type

    @api.onchange("l_sphere")
    def l_sphere_change_value(self):
        if len(self.l_diameter_id) and (self.l_sphere < self.l_diameter_id.sphere_range_min or
                                        self.l_sphere > self.l_diameter_id.sphere_range_max):
            self.l_sphere = 0
            raise ValidationError(
                "Sphere value should be between %s and %s"
                % (
                    self.l_diameter_id.sphere_range_min,
                    self.l_diameter_id.sphere_range_max,
                )
            )

    @api.onchange("l_cylinder")
    def l_cylinder_change_value(self):
        if self.l_cylinder < 0:
            max_no = self.l_diameter_id.cylinder_range_min
            min_no = -self.l_diameter_id.cylinder_range_max
            if len(self.l_diameter_id) and (self.l_cylinder > max_no or
                                            self.l_cylinder < min_no):
                self.l_cylinder = 0
                raise ValidationError(
                    "cylinder value should be between %s and %s"
                    % (
                        -self.l_diameter_id.cylinder_range_max,
                        self.l_diameter_id.cylinder_range_min,
                    )
                )
        else:
            if len(self.l_diameter_id) and (self.l_cylinder > self.l_diameter_id.cylinder_range_min or
                                            self.l_cylinder < self.l_diameter_id.cylinder_range_max):
                self.l_cylinder = 0
                raise ValidationError(
                    "cylinder value should be between %s and %s"
                    % (
                        self.l_diameter_id.cylinder_range_min,
                        self.l_diameter_id.cylinder_range_max,
                    )
                )

    @api.onchange("l_axis")
    def l_axis_change_value(self):
        if len(self.l_diameter_id) and float(self.l_axis) < 0 or float(self.l_axis) > 180:
            self.l_axis = 0
            raise ValidationError(
                "axis value should be between 0 and 180"
                # % (
                #     self.l_diameter_id.axis_range_min,
                #     self.l_diameter_id.axis_range_max,
                # )
            )

        # if len(self.l_diameter_id) and (int(self.l_axis) < self.l_diameter_id.axis_range_min or
        #                                 int(self.l_axis) > self.l_diameter_id.axis_range_min):
        #     self.l_axis = 0
        #     raise ValidationError(
        #         "axis value should be between %s and %s"
        #         % (
        #             self.l_diameter_id.axis_range_min,
        #             self.l_diameter_id.axis_range_max,
        #         )
        #     )

    @api.onchange("l_addition")
    def l_addition_change_value(self):
        if len(self.l_diameter_id) and (self.l_addition < 0.75 or
                                        self.l_addition > 3.50):
            self.l_addition = 0
            raise ValidationError(
                "addition value should be between 0.75 and 3.50"
                # % (
                #     self.l_diameter_id.additional_range_min,
                #     self.l_diameter_id.additional_range_max,
                # )
            )

    @api.onchange("l_prism1")
    def l_prism1_change_value(self):
        if len(self.l_diameter_id) and (self.l_prism1 < self.l_diameter_id.prism_range_min or
                                        self.l_prism1 > self.l_diameter_id.prism_range_max):
            self.l_prism1 = 0
            raise ValidationError(
                "prism1 value should be between %s and %s"
                % (
                    self.l_diameter_id.prism_range_min,
                    self.l_diameter_id.prism_range_max,
                )
            )

    @api.onchange("l_prism2")
    def l_prism2_change_value(self):
        if len(self.l_diameter_id) and (self.l_prism2 < self.l_diameter_id.prism_range_min or
                                        self.l_prism2 > self.l_diameter_id.prism_range_max):
            self.l_prism2 = 0
            raise ValidationError(
                "prism2 value should be between %s and %s"
                % (
                    self.l_diameter_id.prism_range_min,
                    self.l_diameter_id.prism_range_max,
                )
            )

    # @api.onchange("l_base1")
    # def l_base1_change_value(self):
    #     if len(self.l_diameter_id) and (self.l_base1 < self.l_diameter_id.base1_range_min or
    #                                     self.l_base1 > self.l_diameter_id.base1_range_max):
    #         self.l_base1 = 0
    #         raise ValidationError(
    #             "base1 value should be between %s and %s"
    #             % (
    #                 self.l_diameter_id.base1_range_min,
    #                 self.l_diameter_id.base1_range_max,
    #             )
    #         )

    # @api.onchange("l_base2")
    # def l_base2_change_value(self):
    #     if len(self.l_diameter_id) and (self.l_base2 < self.l_diameter_id.base2_range_min or
    #                                     self.l_base2 > self.l_diameter_id.base2_range_max):
    #         self.l_base2 = 0
    #         raise ValidationError(
    #             "base2 value should be between %s and %s"
    #             % (
    #                 self.l_diameter_id.base2_range_min,
    #                 self.l_diameter_id.base2_range_max,
    #             )
    #         )
    #
    # @api.onchange("l_spherometer_dpt")
    # def l_spherometer_dpt_change_value(self):
    #     if len(self.l_diameter_id) and (self.l_spherometer_dpt < self.l_diameter_id.spherometer_dpt_min or
    #                                     self.l_spherometer_dpt > self.l_diameter_id.spherometer_dpt_max):
    #         self.l_spherometer_dpt = 0
    #         raise ValidationError(
    #             "spherometer value should be between %s and %s"
    #             % (
    #                 self.l_diameter_id.spherometer_dpt_min,
    #                 self.l_diameter_id.spherometer_dpt_max,
    #             )
    #         )

    @api.onchange("r_sphere")
    def r_sphere_change_value(self):
        if len(self.r_diameter_id) and (self.r_sphere < self.r_diameter_id.sphere_range_min or
                                        self.r_sphere > self.r_diameter_id.sphere_range_max):
            self.r_sphere = 0
            raise ValidationError(
                "sphere value should be between %s and %s"
                % (
                    self.r_diameter_id.sphere_range_min,
                    self.r_diameter_id.sphere_range_max,
                )
            )

    @api.onchange("r_cylinder")
    def r_cylinder_change_value(self):
        if self.r_cylinder < 0:
            max_no = self.r_diameter_id.cylinder_range_min
            min_no = -self.r_diameter_id.cylinder_range_max
            if len(self.r_diameter_id) and (self.r_cylinder > max_no or
                                            self.r_cylinder < min_no):
                self.r_cylinder = 0
                raise ValidationError(
                    "cylinder value should be between %s and %s"
                    % (
                        min_no,
                        max_no,
                    )
                )
        else:
            if len(self.r_diameter_id) and (self.r_cylinder < self.r_diameter_id.cylinder_range_min or
                                            self.r_cylinder > self.r_diameter_id.cylinder_range_max):
                self.r_cylinder = 0
                raise ValidationError(
                    "cylinder value should be between %s and %s"
                    % (
                        self.r_diameter_id.cylinder_range_min,
                        self.r_diameter_id.cylinder_range_max,
                    )
                )

    @api.onchange("r_axis")
    def r_axis_change_value(self):
        if len(self.l_diameter_id) and int(self.r_axis) < 0 or int(self.r_axis) > 180:
            self.r_axis = 0
            raise ValidationError(
                "axis value should be between 0 and 180"
                # % (
                #     self.l_diameter_id.axis_range_min,
                #     self.l_diameter_id.axis_range_max,
                # )
            )

    @api.onchange("r_addition")
    def r_addition_change_value(self):
        if len(self.l_diameter_id) and (self.r_addition < 0.75 or
                                        self.r_addition > 3.50):
            self.r_addition = 0
            raise ValidationError(
                "addition value should be between 0.75 and 3.50"
            )

    @api.onchange("r_prism1")
    def r_prism1_change_value(self):
        if len(self.r_diameter_id) and (self.r_prism1 < self.r_diameter_id.prism_range_min or
                                        self.r_prism1 > self.r_diameter_id.prism_range_max):
            self.r_prism1 = 0
            raise ValidationError(
                "prism1 value should be between %s and %s"
                % (
                    self.r_diameter_id.prism_range_min,
                    self.r_diameter_id.prism_range_max,
                )
            )

    @api.onchange("r_prism2")
    def r_prism2_change_value(self):
        if len(self.r_diameter_id) and (self.l_prism2 < self.r_diameter_id.prism_range_min or
                                        self.l_prism2 > self.r_diameter_id.prism_range_max):
            self.l_prism2 = 0
            raise ValidationError(
                "prism2 value should be between %s and %s"
                % (
                    self.r_diameter_id.prism_range_min,
                    self.r_diameter_id.prism_range_max,
                )
            )

    @api.model_create_multi
    def create(self, vals_list):
        if vals_list[0].get("lens_side") == "both":
            price_unit = vals_list[0].get("price_unit", False)
            if price_unit:
                vals_list[0].update({
                    "price_total": price_unit * 2
                })

            vals_list[0].update({
                "product_uom_qty": 2
            })

        res = super(OptometristPrescriptionSaleOrderLineConfigurator, self).create(vals_list)
        for list in vals_list:
            if list.get("lens_side") == "both":
                qty = 2
            else:
                qty = 1
            if list.get('color_id') and not list.get('parent_so_line', False):
                color_id = int(list.get('color_id'))
                product_id = self.env["product.product"].search([('id', '=', color_id)])
                self.create({
                    'parent_so_line': res.id,
                    'type': 'color',
                    'product_id': product_id.id,
                    'price_total': product_id.list_price * qty,
                    'order_id': int(list.get('order_id')),
                    "product_uom_qty": qty,
                    'reference_number': list.get('reference_number'),
                    'color_id': color_id,
                })
            if list.get('uv_filter') and not list.get('parent_so_line', False):
                product_id = self.env["product.template"].search([('name', '=', 'UV Filter')]).product_variant_id
                self.create({
                    'parent_so_line': res.id,
                    'type': 'color',
                    'product_id': product_id.id,
                    'price_total': product_id.list_price * qty,
                    'order_id': int(list.get('order_id')),
                    "product_uom_qty": qty,
                    'reference_number': list.get('reference_number'),
                    'uv_filter': True,
                })
            if list.get('coating_id') and not list.get('parent_so_line', False):
                pt_id = int(list.get('coating_id'))
                product_id = self.env["product.template"].search([('id', '=', pt_id)]).product_variant_id
                self.create({
                    'parent_so_line': res.id,
                    'type': 'coating',
                    'product_id': product_id.id,
                    'price_total': product_id.list_price * qty,
                    'order_id': int(list.get('order_id')),
                    "product_uom_qty": qty,
                    'reference_number': list.get('reference_number'),
                    'coating_id': pt_id,
                })
            if list.get('flash_mirror_coating_id') and not list.get('parent_so_line', False):
                flash_mirror_coating_id = int(list.get('flash_mirror_coating_id'))
                product_id = self.env["product.product"].search([('id', '=', flash_mirror_coating_id)])
                self.create({
                    'parent_so_line': res.id,
                    'type': 'coating',
                    'product_id': flash_mirror_coating_id,
                    'price_total': product_id.list_price * qty,
                    'order_id': int(list.get('order_id')),
                    "product_uom_qty": qty,
                    'reference_number': list.get('reference_number'),
                    'flash_mirror_coating_id': flash_mirror_coating_id,
                })
        return res

    def unlink(self):
        """

        :return:
        """
        # self.ensure_one()
        if self.type == "lens":
            lines = self.order_id.order_line.filtered(lambda e: e.parent_so_line.id == self.id)
            for line in lines:
                line.unlink()
                # self.env.cr.execute("""DELETE FROM sale_order_line WHERE id=%s""" % line.id)
                # self.env.cr.commit()
        return super(OptometristPrescriptionSaleOrderLineConfigurator, self).unlink()

    # @api.onchange("r_base1")
    # def r_base1_change_value(self):
    #     if len(self.r_diameter_id) and (self.r_base1 < self.r_diameter_id.base1_range_min or
    #                                     self.r_base1 > self.r_diameter_id.base1_range_max):
    #         self.r_base1 = 0
    #         raise ValidationError(
    #             "base1 value should be between %s and %s"
    #             % (
    #                 self.r_diameter_id.base1_range_min,
    #                 self.r_diameter_id.base1_range_max,
    #             )
    #         )
    #
    # @api.onchange("r_base2")
    # def r_base2_change_value(self):
    #     if len(self.r_diameter_id) and (self.r_base2 < self.r_diameter_id.base2_range_min or
    #                                     self.r_base2 > self.r_diameter_id.base2_range_max):
    #         self.r_base2 = 0
    #         raise ValidationError(
    #             "base2 value should be between %s and %s"
    #             % (
    #                 self.r_diameter_id.base2_range_min,
    #                 self.r_diameter_id.base2_range_max,
    #             )
    #         )
    #
    # @api.onchange("r_spherometer_dpt")
    # def r_spherometer_dpt_change_value(self):
    #     if len(self.r_diameter_id) and (self.r_spherometer_dpt < self.r_diameter_id.spherometer_dpt_min or
    #                                     self.r_spherometer_dpt > self.r_diameter_id.spherometer_dpt_max):
    #         self.r_spherometer_dpt = 0
    #         raise ValidationError(
    #             "spherometer value should be between %s and %s"
    #             % (
    #                 self.r_diameter_id.spherometer_dpt_min,
    #                 self.r_diameter_id.spherometer_dpt_max,
    #             )
    #         )
    #
    # @api.onchange("lpd")
    # def lpd_change_value(self):
    #     if len(self.l_diameter_id) and (self.lpd < self.l_diameter_id.lpd_min or
    #                                     self.lpd > self.l_diameter_id.lpd_max):
    #         self.lpd = 0
    #         raise ValidationError(
    #             "LPD value should be between %s and %s"
    #             % (
    #                 self.l_diameter_id.lpd_min,
    #                 self.l_diameter_id.lpd_max,
    #             )
    #         )
    #
    # @api.onchange("rpd")
    # def rpd_change_value(self):
    #     if len(self.l_diameter_id) and (self.rpd < self.l_diameter_id.rpd_min or
    #                                     self.rpd > self.l_diameter_id.rpd_max):
    #         self.rpd = 0
    #         raise ValidationError(
    #             "RPD value should be between %s and %s"
    #             % (
    #                 self.l_diameter_id.rpd_min,
    #                 self.l_diameter_id.rpd_max,
    #             )
    #         )
    #
    # @api.onchange("bvd")
    # def bvd_change_value(self):
    #     if len(self.l_diameter_id) and (self.bvd < self.l_diameter_id.bvd_min or
    #                                     self.bvd > self.l_diameter_id.bvd_max):
    #         self.bvd = 0
    #         raise ValidationError(
    #             "BVD value should be between %s and %s"
    #             % (
    #                 self.l_diameter_id.bvd_min,
    #                 self.l_diameter_id.bvd_max,
    #             )
    #         )
    #
    # @api.onchange("panta")
    # def panta_change_value(self):
    #     if len(self.l_diameter_id) and (self.panta < self.l_diameter_id.panta_min or
    #                                     self.panta > self.l_diameter_id.panta_max):
    #         self.panta = 0
    #         raise ValidationError(
    #             "panta value should be between %s and %s"
    #             % (
    #                 self.l_diameter_id.panta_min,
    #                 self.l_diameter_id.panta_max,
    #             )
    #         )
    #
    # @api.onchange("ba")
    # def ba_change_value(self):
    #     if len(self.l_diameter_id) and (self.ba < self.l_diameter_id.ba_min or
    #                                     self.ba > self.l_diameter_id.ba_max):
    #         self.ba = 0
    #         raise ValidationError(
    #             "BA value should be between %s and %s"
    #             % (
    #                 self.l_diameter_id.ba_min,
    #                 self.l_diameter_id.ba_max,
    #             )
    #         )
    #
    # @api.onchange("nod")
    # def nod_change_value(self):
    #     if len(self.l_diameter_id) and (self.nod < self.l_diameter_id.nod_min or
    #                                     self.nod > self.l_diameter_id.nod_max):
    #         self.nod = 0
    #         raise ValidationError(
    #             "NOD value should be between %s and %s"
    #             % (
    #                 self.l_diameter_id.nod_min,
    #                 self.l_diameter_id.nod_max,
    #             )
    #         )


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    # def _compute_website_order_line(self):
    #     """ This method will merge multiple discount lines generated by a same program
    #         into a single one (temporary line with `new()`).
    #         This case will only occur when the program is a discount applied on multiple
    #         products with different taxes.
    #         In this case, each taxes will have their own discount line. This is required
    #         to have correct amount of taxes according to the discount.
    #         But we wan't these lines to be `visually` merged into a single one in the
    #         e-commerce since the end user should only see one discount line.
    #         This is only possible since we don't show taxes in cart.
    #         eg:
    #             line 1: 10% discount on product with tax `A` - $15
    #             line 2: 10% discount on product with tax `B` - $11.5
    #             line 3: 10% discount on product with tax `C` - $10
    #         would be `hidden` and `replaced` by
    #             line 1: 10% discount - $36.5
    #
    #         Note: The line will be created without tax(es) and the amount will be computed
    #               depending if B2B or B2C is enabled.
    #     """
    #     super()._compute_website_order_line()
    #     for order in self:
    #         # TODO: potential performance bottleneck downstream
    #         programs = order._get_applied_programs_with_rewards_on_current_order()
    #         for program in programs:
    #             program_lines = order.order_line.filtered(lambda line:
    #                                                       line.product_id == program.discount_line_product_id)
    #             if len(program_lines) > 1:
    #                 if self.env.user.has_group('sale.group_show_price_subtotal'):
    #                     price_unit = sum(program_lines.mapped('price_subtotal'))
    #                 else:
    #                     price_unit = sum(program_lines.mapped('price_total'))
    #                 # TODO: batch then flush
    #                 order.website_order_line += self.env['sale.order.line'].new({
    #                     'product_id': program_lines[0].product_id.id,
    #                     'price_unit': price_unit,
    #                     'name': program_lines[0].name,
    #                     'product_uom_qty': 1,
    #                     'product_uom': program_lines[0].product_uom.id,
    #                     'order_id': order.id,
    #                     'is_reward_line': True,
    #                 })
    #                 order.website_order_line -= program_lines

    def _cart_find_product_line(self, product_id=None, line_id=None, **kwargs):
        """Find the cart line matching the given parameters.

        If a product_id is given, the line will match the product only if the
        line also has the same special attributes: `no_variant` attributes and
        `is_custom` values.
        """
        domain = []
        if line_id:
            domain += [('id', '=', line_id)]
            return self.env['sale.order.line'].sudo().search(domain)
        return self.env['sale.order.line']

    def action_confirm(self):
        so_name = self.display_name
        po = self.env['purchase.order'].search([('origin', '=', so_name)])
        if not po:
            order = super(SaleOrder, self).action_confirm()
            purchase_order = self.env['purchase.order'].search([('origin', '=', so_name)])
            purchase_order.button_confirm()
            purchase_order.action_optiswiss()
            return order
            # return {
            #     'type': 'ir.actions.client',
            #     # 'tag': 'display_notification',
            #     'tag': 'reload',
            #     'params': {
            #         'title': _('Order Successfullly Placed'),
            #         'message': 'Order Successfully Placed at Optiswiss',
            #         'sticky': False,
            #     }
            # }
        else:
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': _('Sale Order already exist'),
                    'message': '%s Sale order already exist in purchase order.' % so_name,
                    'sticky': True,
                }
            }

    def write(self, values):
        lines = values.get('order_line', False)
        flag = False
        if lines:
            for line in lines:
                flag = True if line[0] == 2 else False
                if flag:
                    line_id = line[1]
                    line_id = self.env['sale.order.line'].sudo().browse(line_id)
                    line_id.unlink()
        if flag:
            values.pop('order_line')
        result = super(SaleOrder, self).write(values)
        return result

    def _get_reward_values_discount_percentage_per_line(self, program, line):
        discount_amount = line.product_uom_qty * line.price_reduce * (program.discount_percentage / 100)
        child_lines = self.env['sale.order.line'].search([('parent_so_line', '=', line.id)])
        for cl in child_lines:
            amount = cl.product_uom_qty * cl.price_reduce * (program.discount_percentage / 100)
            discount_amount = discount_amount + amount
        return discount_amount

    def _get_reward_values_discount(self, program):
        if program.discount_type == 'fixed_amount':
            taxes = program.discount_line_product_id.taxes_id
            if self.fiscal_position_id:
                taxes = self.fiscal_position_id.map_tax(taxes)
            return [{
                'name': _("Discount: %s", program.name),
                'product_id': program.discount_line_product_id.id,
                'price_unit': - self._get_reward_values_discount_fixed_amount(program),
                'product_uom_qty': 1.0,
                'product_uom': program.discount_line_product_id.uom_id.id,
                'is_reward_line': True,
                'tax_id': [(4, tax.id, False) for tax in taxes],
            }]
        reward_dict = {}
        lines = self._get_paid_order_lines()
        amount_total = sum(self._get_base_order_lines(program).mapped('price_subtotal'))
        if program.discount_apply_on == 'cheapest_product':
            line = self._get_cheapest_line()
            if line:
                discount_line_amount = min(line.price_reduce * (program.discount_percentage / 100), amount_total)
                if discount_line_amount:
                    taxes = self.fiscal_position_id.map_tax(line.tax_id)

                    reward_dict[line.tax_id] = {
                        'name': _("Discount: %s", program.name),
                        'product_id': program.discount_line_product_id.id,
                        'price_unit': - discount_line_amount if discount_line_amount > 0 else 0,
                        'product_uom_qty': 1.0,
                        'product_uom': program.discount_line_product_id.uom_id.id,
                        'is_reward_line': True,
                        'tax_id': [(4, tax.id, False) for tax in taxes],
                    }
        elif program.discount_apply_on in ['specific_products', 'on_order']:
            if program.discount_apply_on == 'specific_products':
                # We should not exclude reward line that offer this product since we need to offer only the discount on the real paid product (regular product - free product)
                free_product_lines = self.env['coupon.program'].search([('reward_type', '=', 'product'), ('reward_product_id', 'in', program.discount_specific_product_ids.ids)]).mapped('discount_line_product_id')
                lines = lines.filtered(lambda x: x.product_id in (program.discount_specific_product_ids | free_product_lines))

            # when processing lines we should not discount more than the order remaining total
            currently_discounted_amount = 0
            for line in lines:
                discount_line_amount = 0
                if not line.parent_so_line:
                    discount_line_amount = min(self._get_reward_values_discount_percentage_per_line(program, line), amount_total - currently_discounted_amount)

                if discount_line_amount:

                    if line.tax_id in reward_dict:
                        reward_dict[line.tax_id]['price_unit'] -= discount_line_amount
                    else:
                        taxes = self.fiscal_position_id.map_tax(line.tax_id)

                        reward_dict[line.tax_id] = {
                        # reward_dict[line] = {
                            'name': _(
                                "Discount: %(program)s - On product with following taxes: %(taxes)s",
                                program=program.name,
                                taxes=", ".join(taxes.mapped('name')),
                            ),
                            'product_id': program.discount_line_product_id.id,
                            'sequence': line.sequence + 1,
                            'price_unit': - discount_line_amount if discount_line_amount > 0 else 0,
                            'product_uom_qty': 1.0,
                            'product_uom': program.discount_line_product_id.uom_id.id,
                            'is_reward_line': True,
                            'tax_id': [(4, tax.id, False) for tax in taxes],
                        }
                        currently_discounted_amount += discount_line_amount

        # If there is a max amount for discount, we might have to limit some discount lines or completely remove some lines
        max_amount = program._compute_program_amount('discount_max_amount', self.currency_id)
        if max_amount > 0:
            amount_already_given = 0
            for val in list(reward_dict):
                amount_to_discount = amount_already_given + reward_dict[val]["price_unit"]
                if abs(amount_to_discount) > max_amount:
                    reward_dict[val]["price_unit"] = - (max_amount - abs(amount_already_given))
                    add_name = formatLang(self.env, max_amount, currency_obj=self.currency_id)
                    reward_dict[val]["name"] += "( " + _("limited to ") + add_name + ")"
                amount_already_given += reward_dict[val]["price_unit"]
                if reward_dict[val]["price_unit"] == 0:
                    del reward_dict[val]
        return reward_dict.values()
