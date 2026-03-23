import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { buildRegistrationConfirmationHtml } from './templates/registration-confirmation';

/**
 * Mirrors the Prisma include shape from registrations.service.ts:
 *   include: { ticketCategory: { include: { event: true } } }
 * Keep in sync if the Prisma schema or include changes.
 */
interface RegistrationWithEvent {
  id: string;
  fullName: string;
  email: string;
  ticketCategory: {
    name: string;
    event: {
      name: string;
      dateStart: Date;
      dateEnd: Date;
    };
  };
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP transporter verified successfully');
    } catch (err) {
      this.logger.error(
        `SMTP transporter verification failed: ${(err as Error).message}`,
      );
    }
  }

  sendRegistrationConfirmation(registration: RegistrationWithEvent): void {
    const { email, fullName, ticketCategory } = registration;
    const { event } = ticketCategory;

    const html = buildRegistrationConfirmationHtml({
      fullName,
      email,
      eventName: event.name,
      ticketCategoryName: ticketCategory.name,
      eventDateStart: event.dateStart,
      eventDateEnd: event.dateEnd,
      referenceId: registration.id,
    });

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    this.transporter
      .sendMail({
        from,
        to: email,
        subject: `Registration Confirmed - ${event.name}`,
        html,
      })
      .then(() => {
        this.logger.log(`Confirmation email sent to ${email}`);
      })
      .catch((err: Error) => {
        this.logger.error(
          `Failed to send confirmation email to ${email}: ${err.message}`,
        );
      });
  }
}
