import { Injectable, Logger } from '@nestjs/common';

import {
  type IEmailProvider,
  type SendEmailOptions,
  type SendEmailResult,
} from './email.types.js';

@Injectable()
export class NoOpEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(NoOpEmailProvider.name);

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    this.logger.warn(
      `Envio de e-mail ignorado (serviço não configurado): "${options.subject}" para ${recipients.join(', ')}.`,
    );

    return { id: 'noop' };
  }
}
