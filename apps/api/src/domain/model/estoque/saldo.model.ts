import { z } from 'zod';

export const NaturezaSaldoSchema = z.enum(['fisico', 'debito']);

export type NaturezaSaldo = z.infer<typeof NaturezaSaldoSchema>;
