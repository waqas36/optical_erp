# -*- coding: utf-8 -*-

from odoo import models, fields, api


class ColorSectionName(models.Model):
    _name = 'section.name'

    name = fields.Char(string="Section Color")


class ColorSectionValue(models.Model):
    _name = 'section.value'

    name = fields.Char(string="Section Value")
