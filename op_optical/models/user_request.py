# -*- coding: utf-8 -*-
from odoo.addons.portal.wizard.portal_wizard import extract_email
from odoo import models, fields, api, _
from odoo.exceptions import UserError, _logger


class UserRequest(models.Model):
    _name = "user.request"

    name = fields.Char("Name")
    email = fields.Char("Email")
    company = fields.Char("Company")
    street = fields.Char("Street")
    city = fields.Char("City")
    zip_code = fields.Char("Zip Code")
    country = fields.Char("Country")
    vat_number = fields.Char("Vat Number")
    phone = fields.Char("Phone")
    pricelist = fields.Many2one('product.pricelist', string='Price List')
    password = fields.Char("Password")
    state = fields.Selection(string='State', selection=[
        ('draft', 'Draft'),
        ('accept', 'Accepted'),
        ('rejected', 'Rejected'),
    ], default='draft')

    def accept_user_request(self):
        partner = self.env['res.partner'].search(['&', ('email', '=', self.email), ('active', '=', False)], limit=1)
        partner.active = True
        self.state = 'accept'
        group_portal = self.env.ref('base.group_portal')
        user = partner.user_ids[0] if partner.user_ids else None
        if not user:
            # company_id = partner.company_id.id
            company_id = self.env.company.id
            user_portal = self.sudo().with_company(company_id)._create_user(partner)
            # user_portal = user
            partner.update({
                'user_id': user_portal.id
            })
            if not partner.user_id.active or group_portal not in partner.user_id.groups_id:
                partner.user_id.write({'active': True, 'groups_id': [(4, group_portal.id)]})
                # prepare for the signup process
                partner.user_id.partner_id.signup_prepare()
            self._send_email(partner)
            partner.refresh()

    def _create_user(self, partner):
        """ create a new user for wizard_user.partner_id
            :returns record of res.users
        """
        return self.env['res.users'].with_context(no_reset_password=True)._create_user_from_template({
            'email': extract_email(partner.email),
            'login': extract_email(partner.email),
            'password': self.password,
            'partner_id': partner.id,
            'company_id': self.env.company.id,
            'company_ids': [(6, 0, self.env.company.ids)],
            # 'company_id': partner.parent_id.id,
            # 'company_ids': [(6, 0, partner.parent_id.id)],
        })

    def _send_email(self, partner):
        """ send notification email to a new portal user """
        if not self.env.user.email:
            raise UserError(_('You must have an email address in your User Preferences to send emails.'))

        # determine subject and body in the portal user's language
        template = self.env.ref('portal.mail_template_data_portal_welcome')
        lang = partner.lang
        # partner = wizard_line.user_id.partner_id

        portal_url = partner.with_context(signup_force_type_in_url='', lang=lang)._get_signup_url_for_action()[
            partner.id]
        partner.signup_prepare()

        if template:
            template.with_context(dbname=self._cr.dbname, portal_url=portal_url, lang=lang).send_mail(
                0, force_send=True)
        else:
            _logger.warning("No email template found for sending email to the portal user")

        return True

    def reject_user_request(self):
        partner = self.env['res.partner'].search(['&', ('email', '=', self.email), ('active', '=', False)], limit=1)
        if partner:
            user_request = self.env['user.request'].search([('email', '=', self.email)], limit=1)
            user_request.unlink()
            partner.unlink()
