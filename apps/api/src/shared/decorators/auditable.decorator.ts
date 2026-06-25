import { SetMetadata } from '@nestjs/common';

export const AUDITABLE_KEY = 'auditable';

export type AuditableMetadata = {
  action: string;
  resource: string;
  capturePayload?: boolean;
  captureResponse?: boolean;
};

export const Auditable = (metadata: AuditableMetadata) =>
  SetMetadata(AUDITABLE_KEY, {
    capturePayload: true,
    captureResponse: true,
    ...metadata,
  });
