# -*- coding: utf-8 -*-

from odoo import models, fields, api
from pprint import pprint
from odoo.exceptions import ValidationError


class OptometristProductColorOption(models.Model):

    _name = "optometrist.product.color"
    _description = "Color Options"

    color_id = fields.Many2one("product.product", string="Colors")
    product_id = fields.Many2one("product.template", string="Product")


class OptometristProductCoatingOption(models.Model):

    _name = "optometrist.product.coating"
    _description = "Coating Options"

    coating_id = fields.Many2one("product.product", string="Coating")
    product_id = fields.Many2one("product.template", string="Product")


class OptometristProductDioptre(models.Model):

    _name = "optometrist.product.dioptre"
    _description = "Optometrist Product Dioptres"
    name = fields.Char(string="Dioptre Value")


class OptometristProductProgressionLength(models.Model):

    _name = "optometrist.product.progression_length"
    _description = "Optometrist Product Progression Length"
    name = fields.Char(string="Progression length Value")


# class OptometristPrescriptionSaleOrderLineConfigurator(models.Model):
#     _inherit = "sale.order.line"
#     _description = "Optometrist Prescription Order Line"
#
#     lens_side = fields.Selection(
#         [("both", "Both"), ("left", "Left"), ("right", "Right")],
#         string="Lens Side",
#         default="both",
#         required=True,
#     )
#
#     dioptre_id = fields.Many2one(
#         comodel_name="optometrist.product.dioptre", string="Dioptre"
#     )
#
#     l_sphere = fields.Float(string="Lt. Sphere")
#     l_cylinder = fields.Float(string="Lt. Cylinder")
#     l_axis = fields.Float(string="Lt. Axis")
#     l_addition = fields.Float(string="Lt. Addition")
#     l_prism1 = fields.Float(string="Lt. Prism1")
#     l_prism2 = fields.Float(string="Lt. Prism2")
#     l_base1 = fields.Float(string="Lt. Base1")
#     l_base2 = fields.Float(string="Lt. Base2")
#     l_diameter_id = fields.Many2one(
#         "optometrist.product.diameter", string="Lt. Diameter"
#     )
#     l_spherometer_dpt = fields.Float(string="Lt. Base curve in spherometer")
#
#     r_sphere = fields.Float(string="Rt. Sphere")
#     r_cylinder = fields.Float(string="Rt. Cylinder")
#     r_axis = fields.Float(string="Rt. Axis")
#     r_addition = fields.Float(string="Rt. Addition")
#     r_prism1 = fields.Float(string="Rt. Prism1")
#     r_prism2 = fields.Float(string="Rt. Prism2")
#     r_base1 = fields.Float(string="Rt. Base1")
#     r_base2 = fields.Float(string="Rt. Base2")
#     r_diameter_id = fields.Many2one(
#         comodel_name="optometrist.product.diameter", string="Rt. Diameter"
#     )
#     r_spherometer_dpt = fields.Float(string="Rt. Base curve in spherometer")
#
#     lpd = fields.Float(string="Left Pupil Distance")
#     rpd = fields.Float(string="Right Pupil Distance")
#     bdv = fields.Float(string="Back Vertex Distance")
#     panta = fields.Float(string="PantA")
#     ba = fields.Float(string="Below Angle")
#     nod = fields.Float(string="Near Object Distance")
#     progression_length = fields.Many2one(
#         "optometrist.product.progression_length", string="Progression Length"
#     )
#
#     is_individual_parameter_configurable = fields.Boolean(
#         string="Individual Parameter Configurable",
#         compute="_compute_if_individual_parameter_configurable",
#     )
#
#     def _compute_if_individual_parameter_configurable(self):
#         self.is_individual_parameter_configurable = (
#             self.product_template_id.individual_parameter_configurable
#         )
#
#     @api.onchange("l_sphere")
#     def l_sphere_change_value(self):
#         if (
#             self.product_template_id.sphere_range_min
#             < self.product_template_id.sphere_range_max
#         ) and not (
#             self.product_template_id.sphere_range_min
#             <= self.l_sphere
#             <= self.product_template_id.sphere_range_max
#         ):
#             self.l_sphere = 0
#             raise ValidationError(
#                 "Sphere value should be between %s and %s "
#                 % (
#                     self.product_template_id.sphere_range_min,
#                     self.product_template_id.sphere_range_max,
#                 )
#             )
#
#     @api.onchange("l_cylinder")
#     def l_cylinder_change_value(self):
#         if (
#             self.product_template_id.cylinder_range_min
#             < self.product_template_id.cylinder_range_max
#         ) and not (
#             self.product_template_id.cylinder_range_min
#             <= self.l_cylinder
#             <= self.product_template_id.cylinder_range_max
#         ):
#             raise ValidationError(
#                 "Cylinder value should be between %s and %s "
#                 % (
#                     self.product_template_id.cylinder_range_min,
#                     self.product_template_id.cylinder_range_max,
#                 )
#             )
#
#     @api.onchange("l_axis")
#     def l_axis_change_value(self):
#         if (
#             self.product_template_id.axis_range_min
#             < self.product_template_id.axis_range_max
#         ) and not (
#             self.product_template_id.axis_range_min
#             <= self.l_axis
#             <= self.product_template_id.axis_range_max
#         ):
#             raise ValidationError(
#                 "Axis value should be between %s and %s "
#                 % (
#                     self.product_template_id.axis_range_min,
#                     self.product_template_id.axis_range_max,
#                 )
#             )
#
#     @api.onchange("l_addition")
#     def l_addition_change_value(self):
#         if (
#             self.product_template_id.additional_range_min
#             < self.product_template_id.additional_range_max
#         ) and not (
#             self.product_template_id.additional_range_min
#             <= self.l_addition
#             <= self.product_template_id.additional_range_max
#         ):
#             raise ValidationError(
#                 "Additional value should be between %s and %s "
#                 % (
#                     self.product_template_id.additional_range_min,
#                     self.product_template_id.additional_range_max,
#                 )
#             )
#
#     @api.onchange("l_prism1")
#     def l_prism1_change_value(self):
#         if (
#             self.product_template_id.prism1_range_min
#             < self.product_template_id.prism1_range_max
#         ) and not (
#             self.product_template_id.prism1_range_min
#             <= self.l_prism1
#             <= self.product_template_id.prism1_range_max
#         ):
#             raise ValidationError(
#                 "Prism1 value should be between %s and %s "
#                 % (
#                     self.product_template_id.prism1_range_min,
#                     self.product_template_id.prism1_range_max,
#                 )
#             )
#
#     @api.onchange("l_prism2")
#     def l_prism2_change_value(self):
#         if (
#             self.product_template_id.prism2_range_min
#             < self.product_template_id.prism2_range_max
#         ) and not (
#             self.product_template_id.prism2_range_min
#             <= self.l_prism2
#             <= self.product_template_id.prism2_range_max
#         ):
#             raise ValidationError(
#                 "Prism2 value should be between %s and %s "
#                 % (
#                     self.product_template_id.prism2_range_min,
#                     self.product_template_id.prism2_range_max,
#                 )
#             )
#
#     @api.onchange("l_base1")
#     def l_base1_change_value(self):
#         if (
#             self.product_template_id.base1_range_min
#             < self.product_template_id.base1_range_max
#         ) and not (
#             self.product_template_id.base1_range_min
#             <= self.l_base1
#             <= self.product_template_id.base1_range_max
#         ):
#             raise ValidationError(
#                 "Base1 value should be between %s and %s "
#                 % (
#                     self.product_template_id.base1_range_min,
#                     self.product_template_id.base1_range_max,
#                 )
#             )
#
#     @api.onchange("l_base2")
#     def l_base2_change_value(self):
#         if (
#             self.product_template_id.base2_range_min
#             < self.product_template_id.base2_range_max
#         ) and not (
#             self.product_template_id.base2_range_min
#             <= self.l_base2
#             <= self.product_template_id.base2_range_max
#         ):
#             raise ValidationError(
#                 "Base2 value should be between %s and %s "
#                 % (
#                     self.product_template_id.base2_range_min,
#                     self.product_template_id.base2_range_max,
#                 )
#             )
#
#     @api.onchange("l_spherometer_dpt")
#     def l_spherometer_dpt_change_value(self):
#         if (
#             self.product_template_id.spherometer_dpt_min
#             < self.product_template_id.spherometer_dpt_max
#         ) and not (
#             self.product_template_id.spherometer_dpt_min
#             <= self.l_spherometer_dpt
#             <= self.product_template_id.spherometer_dpt_max
#         ):
#             raise ValidationError(
#                 "Base curve spherometer value should be between %s and %s "
#                 % (
#                     self.product_template_id.spherometer_dpt_min,
#                     self.product_template_id.spherometer_dpt_max,
#                 )
#             )
#
#     @api.onchange("r_sphere")
#     def r_sphere_change_value(self):
#         if (
#             self.product_template_id.sphere_range_min
#             < self.product_template_id.sphere_range_max
#         ) and not (
#             self.product_template_id.sphere_range_min
#             <= self.r_sphere
#             <= self.product_template_id.sphere_range_max
#         ):
#             raise ValidationError(
#                 "Sphere value should be between %s and %s "
#                 % (
#                     self.product_template_id.sphere_range_min,
#                     self.product_template_id.sphere_range_max,
#                 )
#             )
#
#     @api.onchange("r_cylinder")
#     def r_cylinder_change_value(self):
#         if (
#             self.product_template_id.cylinder_range_min
#             < self.product_template_id.cylinder_range_max
#         ) and not (
#             self.product_template_id.cylinder_range_min
#             <= self.r_cylinder
#             <= self.product_template_id.cylinder_range_max
#         ):
#             raise ValidationError(
#                 "Cylinder value should be between %s and %s "
#                 % (
#                     self.product_template_id.cylinder_range_min,
#                     self.product_template_id.cylinder_range_max,
#                 )
#             )
#
#     @api.onchange("r_axis")
#     def r_axis_change_value(self):
#         if (
#             self.product_template_id.axis_range_min
#             < self.product_template_id.axis_range_max
#         ) and not (
#             self.product_template_id.axis_range_min
#             <= self.r_axis
#             <= self.product_template_id.axis_range_max
#         ):
#             raise ValidationError(
#                 "Axis value should be between %s and %s "
#                 % (
#                     self.product_template_id.axis_range_min,
#                     self.product_template_id.axis_range_max,
#                 )
#             )
#
#     @api.onchange("r_addition")
#     def r_addition_change_value(self):
#         if (
#             self.product_template_id.additional_range_min
#             < self.product_template_id.additional_range_max
#         ) and not (
#             self.product_template_id.additional_range_min
#             <= self.r_addition
#             <= self.product_template_id.additional_range_max
#         ):
#             raise ValidationError(
#                 "Additional value should be between %s and %s "
#                 % (
#                     self.product_template_id.additional_range_min,
#                     self.product_template_id.additional_range_max,
#                 )
#             )
#
#     @api.onchange("r_prism1")
#     def r_prism1_change_value(self):
#         if (
#             self.product_template_id.prism1_range_min
#             < self.product_template_id.prism1_range_max
#         ) and not (
#             self.product_template_id.prism1_range_min
#             <= self.r_prism1
#             <= self.product_template_id.prism1_range_max
#         ):
#             raise ValidationError(
#                 "Prism1 value should be between %s and %s "
#                 % (
#                     self.product_template_id.prism1_range_min,
#                     self.product_template_id.prism1_range_max,
#                 )
#             )
#
#     @api.onchange("r_prism2")
#     def r_prism2_change_value(self):
#         if (
#             self.product_template_id.prism2_range_min
#             < self.product_template_id.prism2_range_max
#         ) and not (
#             self.product_template_id.prism2_range_min
#             <= self.r_prism2
#             <= self.product_template_id.prism2_range_max
#         ):
#             raise ValidationError(
#                 "Prism2 value should be between %s and %s "
#                 % (
#                     self.product_template_id.prism2_range_min,
#                     self.product_template_id.prism2_range_max,
#                 )
#             )
#
#     @api.onchange("r_base1")
#     def r_base1_change_value(self):
#         if (
#             self.product_template_id.base1_range_min
#             < self.product_template_id.base1_range_max
#         ) and not (
#             self.product_template_id.base1_range_min
#             <= self.r_base1
#             <= self.product_template_id.base1_range_max
#         ):
#             raise ValidationError(
#                 "Base1 value should be between %s and %s "
#                 % (
#                     self.product_template_id.base1_range_min,
#                     self.product_template_id.base1_range_max,
#                 )
#             )
#
#     @api.onchange("r_base2")
#     def r_base2_change_value(self):
#         if (
#             self.product_template_id.base2_range_min
#             < self.product_template_id.base2_range_max
#         ) and not (
#             self.product_template_id.base2_range_min
#             <= self.r_base2
#             <= self.product_template_id.base2_range_max
#         ):
#             raise ValidationError(
#                 "Base2 value should be between %s and %s "
#                 % (
#                     self.product_template_id.base2_range_min,
#                     self.product_template_id.base2_range_max,
#                 )
#             )
#
#     @api.onchange("r_spherometer_dpt")
#     def r_spherometer_dpt_change_value(self):
#         if (
#             self.product_template_id.spherometer_dpt_min
#             < self.product_template_id.spherometer_dpt_max
#         ) and not (
#             self.product_template_id.spherometer_dpt_min
#             <= self.r_spherometer_dpt
#             <= self.product_template_id.spherometer_dpt_max
#         ):
#             raise ValidationError(
#                 "Base curve spherometer value should be between %s and %s "
#                 % (
#                     self.product_template_id.spherometer_dpt_min,
#                     self.product_template_id.spherometer_dpt_max,
#                 )
#             )
#
#     @api.onchange("lpd")
#     def lpd_change_value(self):
#         if (
#             self.product_template_id.lpd_min < self.product_template_id.lpd_max
#         ) and not (
#             self.product_template_id.lpd_min
#             <= self.lpd
#             <= self.product_template_id.lpd_max
#         ):
#             raise ValidationError(
#                 "LPD value should be between %s and %s "
#                 % (self.product_template_id.lpd_min, self.product_template_id.lpd_max)
#             )
#
#     @api.onchange("rpd")
#     def rpd_change_value(self):
#         if (
#             self.product_template_id.rpd_min < self.product_template_id.rpd_max
#         ) and not (
#             self.product_template_id.rpd_min
#             <= self.rpd
#             <= self.product_template_id.rpd_max
#         ):
#             raise ValidationError(
#                 "RPD value should be between %s and %s "
#                 % (self.product_template_id.rpd_min, self.product_template_id.rpd_max)
#             )
#
#     @api.onchange("bvd")
#     def bvd_change_value(self):
#         if (
#             self.product_template_id.bvd_min < self.product_template_id.bvd_max
#         ) and not (
#             self.product_template_id.bvd_min
#             <= self.bvd
#             <= self.product_template_id.bvd_max
#         ):
#             raise ValidationError(
#                 "BVD value should be between %s and %s "
#                 % (self.product_template_id.bvd_min, self.product_template_id.bvd_max)
#             )
#
#     @api.onchange("panta")
#     def panta_change_value(self):
#         if (
#             self.product_template_id.panta_min < self.product_template_id.panta_max
#         ) and not (
#             self.product_template_id.panta_min
#             <= self.panta
#             <= self.product_template_id.panta_max
#         ):
#             raise ValidationError(
#                 "PantA value should be between %s and %s "
#                 % (
#                     self.product_template_id.panta_min,
#                     self.product_template_id.panta_max,
#                 )
#             )
#
#     @api.onchange("ba")
#     def ba_change_value(self):
#         if (self.product_template_id.ba_min < self.product_template_id.ba_max) and not (
#             self.product_template_id.ba_min
#             <= self.ba
#             <= self.product_template_id.ba_max
#         ):
#             raise ValidationError(
#                 "BA value should be between %s and %s "
#                 % (self.product_template_id.ba_min, self.product_template_id.ba_max)
#             )
#
#     @api.onchange("nod")
#     def nod_change_value(self):
#         if (
#             self.product_template_id.nod_min < self.product_template_id.nod_max
#         ) and not (
#             self.product_template_id.nod_min
#             <= self.nod
#             <= self.product_template_id.nod_max
#         ):
#             raise ValidationError(
#                 "NOD value should be between %s and %s "
#                 % (self.product_template_id.nod_min, self.product_template_id.nod_max)
#             )
