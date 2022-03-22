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
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base', 'product', 'sale_management', 'website', 'website_sale'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'views/optometrist_product.xml',
        'views/optometrist_product_configurator.xml',
        'views/website_template.xml',
        'views/cart_lines_template.xml',
        'views/right_cart_template.xml',
        'views/diameter.xml',
        'views/ecommerce_category.xml',
        'views/sign_up.xml',
        'views/user_resquest_menu.xml',
        'views/welcome.xml',
        'views/user_request_exist.xml',
        'views/res_currency.xml',
    ],
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
    'qweb': ['static/src/xml/*.xml'],
    'application': True
}
