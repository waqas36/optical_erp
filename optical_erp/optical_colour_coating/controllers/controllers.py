# -*- coding: utf-8 -*-
# from odoo import http


# class CustomPages(http.Controller):
#     @http.route('/optical_colour_coating/optical_colour_coating/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/optical_colour_coating/optical_colour_coating/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('optical_colour_coating.listing', {
#             'root': '/optical_colour_coating/optical_colour_coating',
#             'objects': http.request.env['optical_colour_coating.optical_colour_coating'].search([]),
#         })

#     @http.route('/optical_colour_coating/optical_colour_coating/objects/<model("optical_colour_coating.optical_colour_coating"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('optical_colour_coating.object', {
#             'object': obj
#         })
