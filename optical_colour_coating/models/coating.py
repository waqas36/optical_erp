# -*- coding: utf-8 -*-

from odoo import models, fields, api


class LensCoating(models.Model):
    _name = 'lens.coating'

    name = fields.Char(string="Name")
    coating_price = fields.Float(string="Price")
    description = fields.Text(string="Description")
    sub_coating_ids = fields.Many2many('sub.coating', 'lens_coating_sub_coating_rel')
    # color_section_value_ids = fields.Many2many('section.value', 'lens_color_section_value_ids_rel')
    product_template_id = fields.Many2one('product.template')
