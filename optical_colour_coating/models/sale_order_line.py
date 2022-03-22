# -*- coding: utf-8 -*-

from odoo import models, fields, api


class InheritSaleOrderLine(models.Model):
    _inherit = 'sale.order.line'

    color_price = fields.Float(string="Color Price", default=0.0)
    coating_price = fields.Float(string="Coating Price", default=0.0)
    lens_price = fields.Float(string="Lens Price", default=0.0)
    reference_number = fields.Char(string="R. No")

    uv_price = fields.Float(string="UV Price")

    flash_mirror_coating_price = fields.Float(string="Flash Mirror Coating Price", default=0.00)

    # @api.onchange('flash_mirror_coating_id')
    # def _onchange_flash_mirror_price(self):
    #     if self.flash_mirror_coating_id:
    #         self.flash_mirror_coating_price = self.flash_mirror_coating_id.lst_price
