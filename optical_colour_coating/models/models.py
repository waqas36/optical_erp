# -*- coding: utf-8 -*-

# from odoo import models, fields, api


# class optical_colour_coating(models.Model):
#     _name = 'optical_colour_coating.optical_colour_coating'
#     _description = 'optical_colour_coating.optical_colour_coating'

#     name = fields.Char()
#     value = fields.Integer()
#     value2 = fields.Float(compute="_value_pc", store=True)
#     description = fields.Text()
#
#     @api.depends('value')
#     def _value_pc(self):
#         for record in self:
#             record.value2 = float(record.value) / 100
