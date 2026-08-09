import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

type InvitationEmailParams = {
  to: string;
  userName: string;
  workspaceName: string;
  invitationUrl: string;
};

type SendPulseToken = {
  accessToken: string;
  expiresAt: number;
};

@Injectable()
export class MailService {
  private transporter?: Transporter;
  private sendPulseToken?: SendPulseToken;

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

  private parseAddress(value: string) {
    const match = value.match(/^(.*)<(.+)>$/);
    if (!match) {
      return {
        name: process.env.MAIL_FROM_NAME || 'Parley',
        email: value.trim(),
      };
    }

    return {
      name: match[1].trim().replace(/^"|"$/g, '') || 'Parley',
      email: match[2].trim(),
    };
  }

  private async getSendPulseAccessToken() {
    const apiKey = process.env.SENDPULSE_API_KEY;
    if (apiKey) return apiKey;

    if (
      this.sendPulseToken &&
      this.sendPulseToken.expiresAt > Date.now() + 60_000
    ) {
      return this.sendPulseToken.accessToken;
    }

    const clientId = process.env.SENDPULSE_CLIENT_ID;
    const clientSecret = process.env.SENDPULSE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error('SendPulse configuration is incomplete');
    }

    const response = await fetch(
      'https://api.sendpulse.com/oauth/access_token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`SendPulse auth failed: ${response.status} ${body}`);
    }

    const data = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!data.access_token) {
      throw new Error('SendPulse auth response does not include access_token');
    }

    this.sendPulseToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    };

    return this.sendPulseToken.accessToken;
  }

  private async sendWithSendPulse(params: {
    to: string;
    userName: string;
    subject: string;
    text: string;
    html: string;
  }) {
    const token = await this.getSendPulseAccessToken();
    const from = this.parseAddress(
      process.env.SENDPULSE_FROM ||
        process.env.MAIL_FROM ||
        'Parley <noreply@example.com>',
    );

    const response = await fetch('https://api.sendpulse.com/smtp/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: {
          html: Buffer.from(params.html).toString('base64'),
          text: params.text,
          subject: params.subject,
          from,
          to: [
            {
              name: params.userName,
              email: params.to,
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`SendPulse send failed: ${response.status} ${body}`);
    }

    return (await response.json()) as unknown;
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

    const driver = this.getDriver();

    if (driver === 'sendpulse') {
      await this.sendWithSendPulse({
        to: params.to,
        userName: params.userName,
        subject,
        text,
        html,
      });

      return { sent: true, driver: 'sendpulse', skipped: false };
    }

    if (driver !== 'smtp') {
      console.log('[mail:invitation]', {
        to: params.to,
        subject,
        invitationUrl: params.invitationUrl,
      });
      return { sent: false, driver, skipped: true };
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
