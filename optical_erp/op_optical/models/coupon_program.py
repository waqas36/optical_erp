# -*- coding: utf-8 -*-
import ast

from odoo import api, fields, models, _


class CouponProgram(models.Model):
    _inherit = 'coupon.program'

    @api.onchange('rule_products_domain')
    def _onchange_rule_products_domain(self):
        domain = self.rule_products_domain
        domain = domain.replace("[", "(")
        domain = domain.replace("]", ")")
        domain = "[" + domain[1:-1] + "]"
        domain = ast.literal_eval(domain)
        # domain = list(domain)
        products = self.env['product.product'].search(domain)
        product_list = []
        for product in products:
            product_list.append(product.id)
        self.discount_specific_product_ids = product_list
        print(self)
        print(self)
        # discount_specific_product_ids
