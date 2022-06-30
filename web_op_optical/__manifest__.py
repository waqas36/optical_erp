# -*- coding: utf-8 -*-
{
    'name': "Index World",

    'summary': """
        Short (1 phrase/line) summary of the module's purpose, used as
        subtitle on modules listing or apps.openerp.com""",

    'description': """
        Long description of module's purpose
    """,

    'author': "Index World",
    'website': "https://indexworld.net/",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/14.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Tools',
    'version': '14.0',

    # any module necessary for this one to work correctly
    'depends': ['base', 'website_sale', 'website', 'optical_colour_coating', 'contacts'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'views/views.xml',
        'views/templates.xml',
        'views/ecommerce_category.xml',
        'views/website_template.xml',
        'views/cart_lines_template.xml',
        'views/right_cart_template.xml',
        'views/sign_up.xml',
        'views/user_resquest_menu.xml',
        'views/welcome.xml',
        'views/user_request_exist.xml',
    ],
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
}
