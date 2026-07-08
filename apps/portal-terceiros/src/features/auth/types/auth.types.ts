import { z } from 'zod';

export const EmailStepSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
});

export const CodeStepSchema = z.object({
  code: z
    .string()
    .length(6, 'Informe o código de 6 dígitos')
    .regex(/^\d+$/, 'O código deve conter apenas números'),
});

export type EmailStepValues = z.infer<typeof EmailStepSchema>;
export type CodeStepValues = z.infer<typeof CodeStepSchema>;
