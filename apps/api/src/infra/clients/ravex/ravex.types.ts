import { z } from 'zod';

export const RavexAccessTokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string().nullable().optional(),
  expires_in: z.coerce.number().int(),
  refresh_token: z.string().nullable().optional(),
});

export type RavexAccessToken = z.infer<typeof RavexAccessTokenSchema>;

export const RavexErrorPairSchema = z.object({
  key: z.string().nullable().optional(),
  value: z.string().nullable().optional(),
});

export type RavexErrorPair = z.infer<typeof RavexErrorPairSchema>;

export const RavexApiEnvelopeSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.nullable().optional(),
    errors: z.array(RavexErrorPairSchema).nullable().optional(),
  });

export type RavexApiEnvelope<T> = {
  success: boolean;
  data?: T | null;
  errors?: RavexErrorPair[] | null;
};

export class RavexApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'RavexApiError';
  }
}
