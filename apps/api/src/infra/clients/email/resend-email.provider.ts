import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend, type CreateEmailOptions } from 'resend';

import {
  type IEmailProvider,
  type SendEmailOptions,
  type SendEmailResult,
} from './email.types.js';

function readEmailEnv(
  configService: ConfigService,
  key: string,
): string | undefined {
  const value = configService.get<string>(key)?.trim();
  return value || undefined;
}

function readEmailFrom(configService: ConfigService): string | undefined {
  return (
    readEmailEnv(configService, 'EMAIL_FROM') ??
    readEmailEnv(configService, 'EMAIL_FROM_DEFAULT')
  );
}

@Injectable()
export class ResendEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(ResendEmailProvider.name);
  private readonly client: Resend;
  private readonly defaultFrom: string | undefined;

  constructor(configService: ConfigService) {
    const apiKey = readEmailEnv(configService, 'RESEND_API_KEY');

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Serviço de email indisponível: defina RESEND_API_KEY.',
      );
    }

    this.client = new Resend(apiKey);
    this.defaultFrom = readEmailFrom(configService);
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!options.html && !options.text) {
      throw new Error('SendEmailOptions requires html or text.');
    }

    const content = options.html
      ? options.text
        ? { html: options.html, text: options.text }
        : { html: options.html }
      : { text: options.text! };

    const from = options.from ?? this.defaultFrom;

    const payload = {
      to: options.to,
      subject: options.subject,
      ...content,
      ...(from ? { from } : {}),
      ...(options.replyTo ? { replyTo: options.replyTo } : {}),
    } as CreateEmailOptions;

    const response = await this.client.emails.send(payload);

    if (response.error) {
      this.logger.error(
        `Falha ao enviar email via Resend: ${response.error.message}`,
      );
      throw new BadGatewayException(
        response.error.message || 'Falha ao enviar email.',
      );
    }

    if (!response.data?.id) {
      throw new BadGatewayException('Resposta inválida ao enviar email.');
    }

    return { id: response.data.id };
  }
}
