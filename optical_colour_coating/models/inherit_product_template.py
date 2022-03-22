# -*- coding: utf-8 -*-

from odoo import models, fields, api


class InheritProductTemplate(models.Model):
    _inherit = "product.template"

    # color_idss = fields.Many2one('product.template', string="Color Name")
    # lens_color_ids = fields.One2many('lens.color', 'product_template_id')
    color_ids = fields.Many2many('product.template', 'product_template_color_rel',
                                 'product_id', 'color_product_id',
                                 domain=[('product_type', '=', 'color')], string="Lens Color")
    coating_ids = fields.Many2many('product.template', 'product_template_coating_rel',
                                   'product_id', 'coating_product_id',
                                   domain=[('product_type', '=', 'coating')], string="Lens Coating")
    is_color = fields.Boolean(string="Add Lens Color", default=False)
    is_coating = fields.Boolean(string="Add Lens Coating", default=False)
    product_type = fields.Selection(string='Product Type', selection=[
        ('lens', 'Lens'),
        ('color', 'Color'),
        ('coating', 'Coating'),
    ], default='lens')

    coating_desc = fields.Html('Body', translate=True, sanitize=False)
    # is_cod = fields.Boolean(string="Add COD", default=False)
    # is_rlf = fields.Boolean(string="Add RLF", default=False)

    # code = fields.Char(string="Opti Swiss Code")
    # test_one = fields.Boolean(string="Extra in File")
    # test_two = fields.Boolean(string="New in File")

    product_info = fields.Html('Product Info', translate=True, sanitize=False)