import { Injectable } from '@nestjs/common';
import { MailerService as MailerMain } from '@nestjs-modules/mailer';
import * as path from 'path';
import * as pug from 'pug';
import { CreateEmailServerDto } from './dto/create-email-server.dto';
import * as process from "node:process";


@Injectable()
export class EmailService {
    constructor(private readonly mailerMain: MailerMain) { }

    /**
    * Sends an email using the provided data.
    *
    * @param {object} datamailer - The data for the email.
    * @param {string} datamailer.templete - The template for the email body.
    * @param {object} datamailer.dataTemplete - The data to be used in the email template.
    * @param {string} datamailer.to - The recipient of the email.
    * @param {string} datamailer.subject - The subject of the email.
    * @param {string} datamailer.text - The plain text version of the email body.
    * @return {Promise<void>} A promise that resolves when the email is sent.
    */
    async sendMail(datamailer : any): Promise<void> {
        // Prepare the data for the Pug template
        const data = {
            logo: process.env.LOGO_URL || 'https://example.com/logo.png', // Replace with your logo URL
            title: datamailer.subject,
            description: datamailer.text,
            message: datamailer.body,
            link: datamailer.link || null, // Optional link for actions like "Verify Email"
            year: new Date().getFullYear(),
        };

        // Render the Pug template
        const render = this._bodytemplete(path.join(__dirname, './template/notification.pug'), data);

        // Send the email
        await this._processSendEmail(datamailer.to, datamailer.subject, datamailer.text, render);
    }

    /**
     * Sends an email using the provided email server.
     *
     * @param {CreateEmailServerDto} email - The email object containing the recipient, subject, and text.
     * @return {Promise<void>} - A promise that resolves when the email is sent successfully.
     */

    async sendMailSandBox(email: CreateEmailServerDto): Promise<void> {
        const templateFile = path.join(__dirname, '../email/template/notification.pug');
        //  const fileImg = path.join(__dirname, '../../src/email-server/template/image/interview.jpg');
        //  const imageData = readFileSync(fileImg).toString('base64');

        const data = {
            title: 'My title',
            //  img: imageData,
            description: email.body,
            year: new Date().getFullYear(),
        };

        const render = this._bodytemplete(templateFile, data);
        console.log(render);
        await this._processSendEmail(email.to, email.subject, email.body, render);
    }

    /**
     * Generate the function comment for the given function body.
     *
     * @param {string} templete - The path to the template file.
     * @param {Object} data - The data object to be passed to the template.
     * @return {string} The rendered template.
     */
    _bodytemplete(templete: any, data: any) {
        return pug.renderFile(templete, { data });
    }

    /**
     * Sends an email with the specified details.
     *
     * @param {string} to - The recipient of the email.
     * @param {string} subject - The subject of the email.
     * @param {string} text - The plain text content of the email.
     * @param {string} body - The HTML content of the email.
     * @return {Promise<void>} A promise that resolves when the email is sent successfully.
     */
    async _processSendEmail(to : any, subject: any, text: any, body: any): Promise<void> {

        await this.mailerMain.sendMail({
            to: to,
            subject: subject,
            text: text || "This is the plain text version of the email.",
            html: body,
        })
            .then(() => {
                console.log('Email sent');
            })
            .catch((e) => {
                console.log('Error sending email', e);
            });
    }

    async sendVerificationEmail(
        to: string,
        email: string,
        code: string,
    ): Promise<void> {
        // const supportUrl = `${process.env.FRONTEND_BASE_URL}support`;
        const data = {
            email,
            code
        };
        //const templatePath = path.join(__dirname, 'template', 'verification.pug');

        const templatePath = path.join(process.cwd(), 'apps/email-service/src/app/email/template/verification.pug');
        //const templatePath = path.join(__dirname, 'email-service/src/app/email/template/verification.pug');
        const htmlBody = this._bodytemplete(templatePath, data);
        await this._processSendEmail(to, 'Verify Your Email', '', htmlBody);
    }

    async sendInterviewInvitation(
        to: string,
        firstName: string,
        jobTitle: string,
        companyName: string,
        date: string,
        startTime: string,
        endTime: string,
        link: string
    ): Promise<void> {
        const supportUrl = `${process.env.FRONTEND_BASE_URL}support`;
        const data = {
            logo: 'https://i.ibb.co/5hDVJmsL/cover.jpg',
            firstName,
            jobTitle,
            companyName,
            date,
            startTime,
            endTime,
            supportUrl,
            meetingLink: link,
            year: new Date().getFullYear(),
        };
        const htmlBody = this._bodytemplete(path.join(__dirname, './template/interview-invitation.pug'), data);
        await this._processSendEmail(to, 'Interview Invitation', '', htmlBody);
    }

    async sendTemporaryCredentials(
        to: string,
        firstName: string,
        lastName: string,
        role: string,
        email: string,
        password: string
    ): Promise<void> {

        const loginUrl = `${process.env.FRONTEND_BASE_URL}login`;
        const supportUrl = `${process.env.FRONTEND_BASE_URL}support`;
        const data = {
            logo: 'https://i.ibb.co/5hDVJmsL/cover.jpg',
            firstName,
            lastName,
            role,
            email,
            password,
            loginUrl,
            supportUrl,
            year: new Date().getFullYear(),
        };
        const htmlBody = this._bodytemplete(path.join(__dirname, './template/temporary-credentials.pug'), data);
        await this._processSendEmail(to, 'Temporary Credentials', '', htmlBody);
    }

    async sendPasswordResetEmail(
        to: string,
        firstName: string,
        lastName: string,
        email: string,
        password: string
    ): Promise<void> {

        const loginUrl = `${process.env.FRONTEND_BASE_URL}login`;
        const supportUrl = `${process.env.FRONTEND_BASE_URL}support`;
        const data = {
            logo: 'https://i.ibb.co/5hDVJmsL/cover.jpg',
            firstName,
            lastName,
            email,
            password,
            loginUrl,
            supportUrl,
            year: new Date().getFullYear(),
        };
        const htmlBody = this._bodytemplete(path.join(__dirname, './template/password-reset.pug'), data);
        await this._processSendEmail(to, 'Password Reset', '', htmlBody);
    }


    async sendNotificationEmail(
        email: string,
        title: string,
        content: string,
    ): Promise<void> {
        
        const data = {
            logo: 'https://i.ibb.co/5hDVJmsL/cover.jpg',
            title,
            content,
            email,

            year: new Date().getFullYear(),
        };
        const templatePath = path.join(process.cwd(), 'src/email/template/send-notification.pug');
        const htmlBody = this._bodytemplete(templatePath, data);
        // const htmlBody = this._bodytemplete(path.join(__dirname, './template/send-notification.pug'), data);
        await this._processSendEmail(email, title, content, htmlBody);
    }
}
