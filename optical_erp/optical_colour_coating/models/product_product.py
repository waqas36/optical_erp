# -*- coding: utf-8 -*-

from odoo import models, fields, api


class InheritProductTemplate(models.Model):
    _inherit = "product.product"

    optiswiss_code = fields.Char(string="Opti Swiss Code")