// apps/email-service/src/email.controller.ts
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @EventPattern('send_verification_code_email')
  async handleSendVerificationCodeEmail(@Payload() data: { user: { email: string }; code: string }) {
    try {
      const { user, code } = data;
      await this.emailService.sendVerificationEmail(user.email, user.email, code);
    } catch (error :any) {
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  @EventPattern('send_temporary_credentials')
  async sendTemporaryCredentials(@Payload() data: { newuser: { email: string; firstName: string; lastName: string; role: string }; password: string }) {
    try {
      const { newuser, password } = data;
      await this.emailService.sendTemporaryCredentials(newuser.email, newuser.firstName, newuser.lastName, newuser.role, newuser.email, password);
    } catch (error:any) {
      throw new Error(`Failed to send temporary credentials: ${error.message}`);
    }
  }

  @EventPattern('send_forgot_password')
  async sendPasswordResetEmail(@Payload() data: { user: { email: string; firstName: string; lastName: string }; password: string }) {
    try {
      const { user, password } = data;
      await this.emailService.sendPasswordResetEmail(user.email, user.firstName, user.lastName, user.email, password);
    } catch (error:any) {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  @EventPattern('send_notification_email')
  async sendNotificationEmail(@Payload() data: { email: string; title: string; content: string }) {
    try {
      const { email, title, content } = data;
      await this.emailService.sendNotificationEmail(email, title, content);
    } catch (error:any) {
      throw new Error(`Failed to send notification email: ${error.message}`);
    }
  }
}