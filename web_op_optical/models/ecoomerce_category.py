# -*- coding: utf-8 -*-

from odoo import fields, models


class InheritWebsiteCategory(models.Model):
    _inherit = 'product.public.category'

    is_category_active = fields.Boolean(string="Active")
