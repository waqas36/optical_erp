# -*- coding: utf-8 -*-

from odoo import models, fields, api


class LensColor(models.Model):
    _name = 'lens.color'

    name = fields.Char(string="Name")
    color_price = fields.Float(string="Price")
    description = fields.Text(string="Description")
    color_section_name_ids = fields.Many2many('section.name', 'lens_color_section_name_ids_rel')
    color_section_value_ids = fields.Many2many('section.value', 'lens_color_section_value_ids_rel')
    product_template_id = fields.Many2one('product.template')
