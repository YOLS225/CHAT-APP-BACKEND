import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

type InvitationEmailParams = {
  to: string;
  userName: string;
  workspaceName: string;
  invitationUrl: string;
};

@Injectable()
export class MailService {
  private transporter?: Transporter;

  private getDriver() {
    return process.env.MAIL_DRIVER || 'console';
  }

  private getTransporter() {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error('SMTP configuration is incomplete');
    }

    this.transporter = createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user,
        pass,
      },
    });

    return this.transporter;
  }

  async sendInvitationEmail(params: InvitationEmailParams) {
    const from = process.env.MAIL_FROM || 'Chat App <noreply@example.com>';
    const subject = `Invitation à rejoindre ${params.workspaceName}`;
    const text = [
      `Bonjour ${params.userName},`,
      '',
      `Vous avez été invité à rejoindre ${params.workspaceName}.`,
      `Définissez votre mot de passe avec ce lien: ${params.invitationUrl}`,
      '',
      'Ce lien expire dans 7 jours.',
    ].join('\n');
    const html = `
      <p>Bonjour ${params.userName},</p>
      <p>Vous avez été invité à rejoindre <strong>${params.workspaceName}</strong>.</p>
      <p><a href="${params.invitationUrl}">Définir mon mot de passe</a></p>
      <p>Ce lien expire dans 7 jours.</p>
    `;

    if (this.getDriver() !== 'smtp') {
      console.log('[mail:invitation]', {
        to: params.to,
        subject,
        invitationUrl: params.invitationUrl,
      });
      return { sent: false, driver: this.getDriver(), skipped: true };
    }

    await this.getTransporter().sendMail({
      from,
      to: params.to,
      subject,
      text,
      html,
    });

    return { sent: true, driver: 'smtp', skipped: false };
  }
}
