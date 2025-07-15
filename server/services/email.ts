import nodemailer from 'nodemailer';
import { storage } from '../storage';
import type { Invoice, User } from '@shared/schema';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async sendConfirmationEmail(user: User, token: string): Promise<void> {
    const confirmUrl = `${process.env.APP_URL || 'http://localhost:5000'}/confirm-email?token=${token}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: 'Confirm your Flow account',
      html: `
        <h2>Welcome to Flow!</h2>
        <p>Please click the link below to confirm your email address:</p>
        <a href="${confirmUrl}">Confirm Email</a>
        <p>If you didn't create an account, please ignore this email.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: user.email,
      subject: 'Reset your Flow password',
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendInvoiceNudge(invoice: Invoice, user: User, nudgeNumber: number): Promise<void> {
    const unsubscribeUrl = `${process.env.APP_URL || 'http://localhost:5000'}/unsubscribe?invoice=${invoice.id}`;
    
    const template = await this.getEmailTemplate(user, nudgeNumber);
    
    const subject = this.replaceVariables(template.subject, invoice, user);
    const body = this.replaceVariables(template.body, invoice, user);
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: invoice.clientEmail,
      replyTo: user.email,
      subject,
      html: `
        ${body}
        <br><br>
        <hr>
        <p style="font-size: 12px; color: #666;">
          This email was sent by ${user.businessName || user.email} using Flow.<br>
          <a href="${unsubscribeUrl}">Unsubscribe from these reminders</a>
        </p>
      `,
    };

    await this.transporter.sendMail(mailOptions);

    // Log the nudge
    await storage.createNudgeLog({
      invoiceId: invoice.id,
      emailSubject: subject,
      emailBody: body,
    });

    // Update invoice nudge count and last nudge date
    await storage.updateInvoice(invoice.id, {
      nudgeCount: (invoice.nudgeCount || 0) + 1,
      lastNudgeAt: new Date(),
    });
  }

  private async getEmailTemplate(user: User, nudgeNumber: number): Promise<{ subject: string; body: string }> {
    const template = await storage.getEmailTemplateByUser(user.id, user.messageTone || 'friendly');
    
    if (template) {
      return {
        subject: template.subject,
        body: template.body,
      };
    }

    // Default templates based on tone and nudge number
    const tone = user.messageTone || 'friendly';
    
    if (tone === 'friendly') {
      return this.getFriendlyTemplate(nudgeNumber);
    } else {
      return this.getFirmTemplate(nudgeNumber);
    }
  }

  private getFriendlyTemplate(nudgeNumber: number): { subject: string; body: string } {
    const subjects = [
      'Friendly reminder about Invoice {{invoice_id}}',
      'Following up on Invoice {{invoice_id}}',
      'Final reminder: Invoice {{invoice_id}} is overdue',
    ];

    const bodies = [
      `Hi {{client_name}},<br><br>
      I hope this email finds you well. I wanted to send a friendly reminder that Invoice {{invoice_id}} for {{amount}} was due on {{due_date}}.<br><br>
      If you've already taken care of this, please disregard this email. Otherwise, I'd appreciate if you could process the payment at your earliest convenience.<br><br>
      Thanks so much!<br>
      {{business_name}}`,
      
      `Hi {{client_name}},<br><br>
      I'm following up on Invoice {{invoice_id}} for {{amount}} which was due on {{due_date}}.<br><br>
      If there are any questions or concerns about this invoice, please don't hesitate to reach out. I'm here to help!<br><br>
      Thank you for your attention to this matter.<br><br>
      Best regards,<br>
      {{business_name}}`,
      
      `Hi {{client_name}},<br><br>
      This is a final reminder that Invoice {{invoice_id}} for {{amount}} is now overdue (due date: {{due_date}}).<br><br>
      Please arrange payment as soon as possible. If you have any questions, please contact me directly.<br><br>
      Thank you,<br>
      {{business_name}}`,
    ];

    const index = Math.min(nudgeNumber - 1, subjects.length - 1);
    return {
      subject: subjects[index],
      body: bodies[index],
    };
  }

  private getFirmTemplate(nudgeNumber: number): { subject: string; body: string } {
    const subjects = [
      'Payment Required: Invoice {{invoice_id}}',
      'Overdue Payment: Invoice {{invoice_id}}',
      'URGENT: Final Notice for Invoice {{invoice_id}}',
    ];

    const bodies = [
      `Dear {{client_name}},<br><br>
      Invoice {{invoice_id}} for {{amount}} was due on {{due_date}} and remains unpaid.<br><br>
      Please process payment immediately to avoid any service interruption.<br><br>
      {{business_name}}`,
      
      `Dear {{client_name}},<br><br>
      Invoice {{invoice_id}} for {{amount}} is now overdue (due date: {{due_date}}).<br><br>
      Immediate payment is required. Please remit payment within 48 hours.<br><br>
      {{business_name}}`,
      
      `Dear {{client_name}},<br><br>
      This is a final notice regarding Invoice {{invoice_id}} for {{amount}} which was due on {{due_date}}.<br><br>
      Payment must be received immediately to avoid further action.<br><br>
      {{business_name}}`,
    ];

    const index = Math.min(nudgeNumber - 1, subjects.length - 1);
    return {
      subject: subjects[index],
      body: bodies[index],
    };
  }

  private replaceVariables(template: string, invoice: Invoice, user: User): string {
    return template
      .replace(/{{client_name}}/g, invoice.clientName)
      .replace(/{{invoice_id}}/g, invoice.invoiceId)
      .replace(/{{amount}}/g, `$${invoice.amount}`)
      .replace(/{{due_date}}/g, invoice.dueDate.toLocaleDateString())
      .replace(/{{business_name}}/g, user.businessName || user.email);
  }
}

export const emailService = new EmailService();
