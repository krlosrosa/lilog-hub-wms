import { z } from 'zod';

export const linhaSeparacaoStatusSchema = z.enum([
  'pendente',
  'gerado',
  'impresso',
  'separado',
]);

export type LinhaSeparacaoStatus = z.infer<typeof linhaSeparacaoStatusSchema>;

export const LINHA_SEPARACAO_STATUS_LABELS: Record<
  LinhaSeparacaoStatus,
  string
> = {
  pendente: 'Pendente',
  gerado: 'Gerado',
  impresso: 'Impresso',
  separado: 'Separado',
};

export const linhaSeparacaoSchema = z.object({
  id: z.string(),
  transporte: z.string(),
  remessa: z.string(),
  cliente: z.string(),
  nomeCliente: z.string(),
  sku: z.string(),
  descricao: z.string(),
  quantidade: z.number().int().min(1),
  status: linhaSeparacaoStatusSchema.default('pendente'),
});

export type LinhaSeparacao = z.infer<typeof linhaSeparacaoSchema>;

export const etiquetaSeparacaoSchema = linhaSeparacaoSchema.extend({
  numeroCaixa: z.number().int().min(1),
  totalCaixas: z.number().int().min(1),
  codigo: z.string(),
});

export type EtiquetaSeparacao = z.infer<typeof etiquetaSeparacaoSchema>;
