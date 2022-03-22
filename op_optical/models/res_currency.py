# -*- coding: utf-8 -*-

from odoo import models, fields, api


class ResCurrencyInherit(models.Model):
    _inherit = "res.currency"
    _description = "res currency inherit"

    country_code = fields.Char(string="Country Code")