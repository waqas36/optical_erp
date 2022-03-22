# -*- coding: utf-8 -*-

from odoo import models, fields, api


class SubCoating(models.Model):
    _name = 'sub.coating'

    name = fields.Char(string="Sub Coating Name")
    description = fields.Char(string="Description")
