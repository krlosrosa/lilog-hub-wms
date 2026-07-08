export const EMAIL_PROVIDER = 'IEmailProvider';

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
};

export type SendEmailResult = {
  id: string;
};

export interface IEmailProvider {
  send(options: SendEmailOptions): Promise<SendEmailResult>;
}
