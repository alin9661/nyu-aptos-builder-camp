import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Email configuration
 */
export interface EmailConfig {
  provider: 'sendgrid' | 'mailgun' | 'ses' | 'smtp';
  apiKey?: string;
  domain?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
}

/**
 * Email data for wallet created
 */
export interface WalletCreatedEmailData {
  to: string;
  displayName: string;
  walletAddress: string;
  network: 'testnet' | 'mainnet';
}

/**
 * Email data for wallet education
 */
export interface WalletEducationEmailData {
  to: string;
  walletAddress: string;
}

/**
 * Email data for wallet funded
 */
export interface WalletFundedEmailData {
  to: string;
  walletAddress: string;
  amount: string;
  txHash: string;
}

/**
 * Email service for sending notifications
 */
export class EmailService {
  private config: EmailConfig;

  constructor() {
    this.config = {
      provider: (process.env.EMAIL_PROVIDER as any) || 'smtp',
      apiKey: process.env.EMAIL_API_KEY,
      domain: process.env.EMAIL_DOMAIN,
      fromEmail: process.env.EMAIL_FROM || 'noreply@nexus.nyu.edu',
      fromName: process.env.EMAIL_FROM_NAME || 'NYU Nexus',
      replyTo: process.env.EMAIL_REPLY_TO,
    };
  }

  /**
   * Send wallet created email
   */
  async sendWalletCreatedEmail(data: WalletCreatedEmailData): Promise<void> {
    try {
      const subject = 'Welcome to NYU Nexus - Your Aptos Wallet is Ready!';
      const htmlTemplate = this.loadTemplate('wallet-created.html');
      const textTemplate = this.loadTemplate('wallet-created.txt');

      const network = data.network || 'testnet';
      const explorerUrl = `https://explorer.aptoslabs.com/account/${data.walletAddress}?network=${network}`;
      const supportUrl = process.env.SUPPORT_URL || 'https://nexus.nyu.edu/support';
      const unsubscribeUrl = this.getUnsubscribeUrl(data.to);

      // Replace placeholders in templates
      const replacements = {
        displayName: data.displayName,
        walletAddress: data.walletAddress,
        network: network.toUpperCase(),
        explorerUrl,
        supportUrl,
        unsubscribeUrl,
        currentYear: new Date().getFullYear().toString(),
      };

      const html = this.replacePlaceholders(htmlTemplate, replacements);
      const text = this.replacePlaceholders(textTemplate, replacements);

      await this.sendEmail({
        to: data.to,
        subject,
        html,
        text,
      });

      logger.info('Wallet created email sent successfully', {
        to: data.to,
        walletAddress: data.walletAddress,
      });
    } catch (error) {
      logger.error('Failed to send wallet created email', { error, data });
      throw error;
    }
  }

  /**
   * Send wallet education email
   */
  async sendWalletEducationEmail(data: WalletEducationEmailData): Promise<void> {
    try {
      const subject = 'Understanding Your Aptos Wallet - Security Guide';
      const htmlTemplate = this.loadTemplate('wallet-security-guide.html');
      const textTemplate = this.loadTemplate('wallet-security-guide.txt');

      const supportUrl = process.env.SUPPORT_URL || 'https://nexus.nyu.edu/support';
      const docsUrl = process.env.DOCS_URL || 'https://nexus.nyu.edu/docs';
      const unsubscribeUrl = this.getUnsubscribeUrl(data.to);

      const replacements = {
        walletAddress: data.walletAddress,
        supportUrl,
        docsUrl,
        unsubscribeUrl,
        currentYear: new Date().getFullYear().toString(),
      };

      const html = this.replacePlaceholders(htmlTemplate, replacements);
      const text = this.replacePlaceholders(textTemplate, replacements);

      await this.sendEmail({
        to: data.to,
        subject,
        html,
        text,
      });

      logger.info('Wallet education email sent successfully', { to: data.to });
    } catch (error) {
      logger.error('Failed to send wallet education email', { error, data });
      throw error;
    }
  }

  /**
   * Send wallet funded email
   */
  async sendWalletFundedEmail(data: WalletFundedEmailData): Promise<void> {
    try {
      const subject = 'Your Wallet Has Been Funded!';
      const network = process.env.APTOS_NETWORK || 'testnet';
      const explorerUrl = `https://explorer.aptoslabs.com/txn/${data.txHash}?network=${network}`;
      const unsubscribeUrl = this.getUnsubscribeUrl(data.to);

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Wallet Funded Successfully!</h2>
          <p>Great news! Your Aptos wallet has been funded.</p>

          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Wallet Address:</strong><br>${data.walletAddress}</p>
            <p><strong>Amount:</strong> ${data.amount} APT</p>
            <p><strong>Transaction Hash:</strong><br>${data.txHash.substring(0, 20)}...</p>
          </div>

          <p>
            <a href="${explorerUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Transaction
            </a>
          </p>

          <p>You can now use your wallet to participate in governance, submit reimbursement requests, and more.</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
          <p style="font-size: 12px; color: #6B7280;">
            <a href="${unsubscribeUrl}" style="color: #6B7280;">Unsubscribe</a> from these emails
          </p>
        </div>
      `;

      const text = `
Wallet Funded Successfully!

Your Aptos wallet has been funded.

Wallet Address: ${data.walletAddress}
Amount: ${data.amount} APT
Transaction Hash: ${data.txHash}

View transaction: ${explorerUrl}

You can now use your wallet to participate in governance, submit reimbursement requests, and more.

---
Unsubscribe: ${unsubscribeUrl}
      `;

      await this.sendEmail({
        to: data.to,
        subject,
        html,
        text,
      });

      logger.info('Wallet funded email sent successfully', { to: data.to, amount: data.amount });
    } catch (error) {
      logger.error('Failed to send wallet funded email', { error, data });
      throw error;
    }
  }

  /**
   * Send email using configured provider
   */
  private async sendEmail(data: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    try {
      switch (this.config.provider) {
        case 'sendgrid':
          await this.sendWithSendGrid(data);
          break;
        case 'mailgun':
          await this.sendWithMailgun(data);
          break;
        case 'ses':
          await this.sendWithSES(data);
          break;
        case 'smtp':
        default:
          await this.sendWithSMTP(data);
          break;
      }
    } catch (error) {
      logger.error('Failed to send email', { error, provider: this.config.provider });
      throw error;
    }
  }

  /**
   * Send email with SendGrid
   */
  private async sendWithSendGrid(data: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    // Note: Requires @sendgrid/mail package
    // npm install @sendgrid/mail
    try {
      logger.info('SendGrid provider not yet implemented, using mock send', {
        to: data.to,
        subject: data.subject,
      });
      // TODO: Implement SendGrid
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(this.config.apiKey);
      // await sgMail.send({
      //   to: data.to,
      //   from: { email: this.config.fromEmail, name: this.config.fromName },
      //   subject: data.subject,
      //   text: data.text,
      //   html: data.html,
      // });
    } catch (error) {
      logger.error('SendGrid send failed', { error });
      throw error;
    }
  }

  /**
   * Send email with Mailgun
   */
  private async sendWithMailgun(data: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    // Note: Requires mailgun.js package
    try {
      logger.info('Mailgun provider not yet implemented, using mock send', {
        to: data.to,
        subject: data.subject,
      });
      // TODO: Implement Mailgun
    } catch (error) {
      logger.error('Mailgun send failed', { error });
      throw error;
    }
  }

  /**
   * Send email with AWS SES
   */
  private async sendWithSES(data: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    // Note: Requires @aws-sdk/client-ses package
    try {
      logger.info('AWS SES provider not yet implemented, using mock send', {
        to: data.to,
        subject: data.subject,
      });
      // TODO: Implement AWS SES
    } catch (error) {
      logger.error('AWS SES send failed', { error });
      throw error;
    }
  }

  /**
   * Send email with SMTP (development/fallback)
   */
  private async sendWithSMTP(data: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<void> {
    // Note: Requires nodemailer package
    try {
      logger.info('SMTP provider - simulating email send', {
        to: data.to,
        subject: data.subject,
      });

      // For development, just log the email
      logger.info('Email content', {
        to: data.to,
        from: this.config.fromEmail,
        subject: data.subject,
        textPreview: data.text.substring(0, 100),
      });

      // TODO: Implement nodemailer for actual SMTP
      // const nodemailer = require('nodemailer');
      // const transporter = nodemailer.createTransport({...});
      // await transporter.sendMail({...});
    } catch (error) {
      logger.error('SMTP send failed', { error });
      throw error;
    }
  }

  /**
   * Load email template from file
   */
  private loadTemplate(filename: string): string {
    try {
      const templatePath = path.join(__dirname, '../templates/emails', filename);

      // Check if template exists, return placeholder if not
      if (!fs.existsSync(templatePath)) {
        logger.warn('Email template not found, using placeholder', { filename });
        return this.getPlaceholderTemplate(filename);
      }

      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      logger.error('Failed to load email template', { error, filename });
      return this.getPlaceholderTemplate(filename);
    }
  }

  /**
   * Get placeholder template if file doesn't exist
   */
  private getPlaceholderTemplate(filename: string): string {
    if (filename.endsWith('.html')) {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>{{subject}}</h2>
          <p>{{message}}</p>
        </div>
      `;
    }
    return '{{subject}}\n\n{{message}}';
  }

  /**
   * Replace placeholders in template
   */
  private replacePlaceholders(
    template: string,
    replacements: Record<string, string>
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  /**
   * Get unsubscribe URL for email
   */
  private getUnsubscribeUrl(email: string): string {
    const baseUrl = process.env.APP_URL || 'https://nexus.nyu.edu';
    const encodedEmail = encodeURIComponent(email);
    return `${baseUrl}/settings/notifications?unsubscribe=true&email=${encodedEmail}`;
  }
}
