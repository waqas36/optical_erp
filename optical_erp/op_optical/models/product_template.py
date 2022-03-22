# -*- coding: utf-8 -*-

from odoo import models, fields, api


class OptometristProductConfigurator(models.Model):
    _inherit = "product.template"
    _description = "Optometrist Product Configurator"

    lens_code = fields.Char("Lens Code")
    ne = fields.Float(string="Negative")
    ve = fields.Float(string="Positive")
    pgcm3 = fields.Float(string="p (g/cm3)")
    uvcut = fields.Float(string="UV-Cut(nm)")
    absorption = fields.Char(string="Absorption")
    # product_code = fields.Char(string="Product Code")

    edi_code = fields.Char(string="EDI Code")
    Permardur = fields.Char(string="Permardur")

    is_single_lens_sellable = fields.Boolean(
        string="Single Lens Sellable?", default=True
    )
    is_customisable = fields.Boolean(string="Is customisable?")

    sphere_range_min = fields.Float(string="Sphere Min Value")
    sphere_range_max = fields.Float(string="Sphere Max Value")

    cylinder_range_min = fields.Float(string="Cylinder Min Value")

    cylinder_range_max = fields.Float(string="Cylinder Max Value")

    axis_range_min = fields.Float(string="Axis Min Value")
    axis_range_max = fields.Float(string="Axis Max Value")

    additional_range_min = fields.Float(string="Additional Min Value")
    additional_range_max = fields.Float(string="Additional Max Value")

    can_configure_prism = fields.Boolean(string="Can configure Prism?", default=False)

    prism1_range_min = fields.Float(string="Prism1 Min Value")
    prism1_range_max = fields.Float(string="Prism1 Max Value")

    prism2_range_min = fields.Float(string="Prism2 Min Value")
    prism2_range_max = fields.Float(string="Prism2 Max Value")

    base1_range_min = fields.Float(string="Base1 Min Value")
    base1_range_max = fields.Float(string="Base1 Max Value")

    base2_range_min = fields.Float(string="Base2 Min Value")
    base2_range_max = fields.Float(string="Base2 Max Value")

    spherometer_dpt_min = fields.Float(string="Spherometer -1 dpt Value")
    spherometer_dpt_std = fields.Float(string="Spherometer Standard Value")
    spherometer_dpt_max = fields.Float(string="Spherometer +1 dpt Value")

    individual_parameter_configurable = fields.Boolean(
        string="Indiv. Parameters Configuration"
    )

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

    lpd_min = fields.Float(string="LPD Min Value", default=15)
    lpd_max = fields.Float(string="LPD Max Value", default=40)
    lpd_std = fields.Float(string="LPD Standard Value", default=32.5)

    rpd_min = fields.Float(string="RPD Min Value", default=15)
    rpd_max = fields.Float(string="RPD Max Value", default=40)
    rpd_std = fields.Float(string="RPD Standard Value", default=32.5)

    bvd_min = fields.Float(string="BVD Min Value", default=7)
    bvd_max = fields.Float(string="BVD Max Value", default=30)
    bvd_std = fields.Float(string="BVD Standard Value", default=14.5)

    panta_min = fields.Float(string="PantA Min Value", default=5)
    panta_max = fields.Float(string="PantA Max Value", default=25)
    panta_std = fields.Float(string="PantA Standard Value", default=9)

    ba_min = fields.Float(string="BA Min Value", default=0)
    ba_max = fields.Float(string="BA Max Value", default=35)
    ba_std = fields.Float(string="BA Standard Value", default=5)

    nod_min = fields.Float(string="NOD Min Value", default=200)
    nod_max = fields.Float(string="NOD Max Value", default=600)
    nod_std = fields.Float(string="NOD Standard Value")

    dioptre_option_ids = fields.Many2many(
        "optometrist.product.dioptre", string="Dioptre"
    )
    diameter_option_ids = fields.One2many(
        "optometrist.product.diameter", "product_id", string="Diameter"
    )

    progression_length_ids = fields.Many2many(
        "optometrist.product.progression_length", string="Progression Length"
    )

    _sql_constraints = [('edi_code_uniq', 'unique (edi_code)', 'Code must be unique!'),
                        ('lens_code_uniq', 'unique (lens_code)', 'Lens Code must be unique!')]

    def get_product_colour_data(self, id):
        product_id = self.env['product.template'].sudo().browse(id)
        product_color_data = []
        product_coating_data = []
        for coating_id in product_id.lens_coating_ids:
            sub_coating_list = []
            for sub_coating in coating_id.sub_coating_ids:
                sub_coating_list.append(sub_coating.name)
            product_coating_data.append([coating_id.id, coating_id.name, coating_id.coating_price, sub_coating_list, coating_id.description])

        for color_id in product_id.lens_color_ids:
            color_name_list = []
            for color_section in color_id.color_section_name_ids:
                color_name_list.append(color_section.name)
            color_values_list = []
            for color_values in color_id.color_section_value_ids:
                color_values_list.append(color_values.name)
            product_color_data.append(
                [color_id.id, color_id.name, color_id.color_price, color_name_list, color_values_list,
                 color_id.description])

        return [product_color_data, product_coating_data]

    def get_progression_length(self, product_id):
        progression_length = self.env['product.template'].sudo().search([('id', '=', product_id)]).progression_length_ids
        pl_list = []
        for pl in progression_length:
            pl_list.append({
                'id': pl.id,
                'name': pl.name
            })
        return pl_list

    def get_coating_desc(self):
        # print(pt_id)
        pt = self.env['product.template'].sudo().search([('id', '=', self.id)])
        return {
            'name': pt.name,
            'coating_desc': pt.coating_desc,
        }

    def get_product_info(self):
        pt = self.env['product.template'].sudo().search([('id', '=', self.id)])
        return {
            'name': pt.name,
            'product_info': pt.product_info,
        }
