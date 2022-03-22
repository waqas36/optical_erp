# -*- coding: utf-8 -*-

from odoo import models, fields, api
from pprint import pprint
from odoo.exceptions import ValidationError


class OptometristProductDiameter(models.Model):

    _name = "optometrist.product.diameter"
    _description = "Optometrist Product Diameter"

    name = fields.Char(string="Diameter Value")

    sphere_range_min = fields.Float(string="Sphere Min Value")
    sphere_range_max = fields.Float(string="Sphere Max Value")

    cylinder_range_min = fields.Float(string="Cylinder Min Value")
    cylinder_range_max = fields.Float(string="Cylinder Max Value")

    additional_range_min = fields.Float(string="Additional Min Value")
    additional_range_max = fields.Float(string="Additional Max Value")

    prism_range_min = fields.Float(string="Prism Min Value")
    prism_range_max = fields.Float(string="Prism Max Value")

    # axis_range_min = fields.Float(string="Axis Min Value")
    # axis_range_max = fields.Float(string="Axis Max Value")

    lens_code = fields.Char("Lens Code")
    product_id = fields.Many2one("product.template", string="Product", readonly=True)

    @api.model_create_multi
    def create(self, vals):
        lines = super().create(vals)
        # Do not generate task/project when expense SO line, but allow
        # generate task with hours=0.
        for line in lines:
            if line.lens_code:
                product = self.env["product.template"].search([("edi_code", "=", line.lens_code)])
                if len(product):
                    line.product_id = product.id

        return lines
