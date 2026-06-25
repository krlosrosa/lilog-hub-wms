import { z } from 'zod';

import type { EnderecoStatus } from '@/features/enderecos/types/enderecos-gestao.schema';

export const loteEnderecoStatusSchema = z.enum([
  'pronto',
  'em-uso',
  'bloqueado',
]);

export type LoteEnderecoStatus = z.infer<typeof loteEnderecoStatusSchema>;

export const loteEnderecoItemSchema = z.object({
  id: z.string(),
  endereco: z.string(),
  tipo: z.string(),
  status: loteEnderecoStatusSchema,
});

export type LoteEnderecoItem = z.infer<typeof loteEnderecoItemSchema>;

export const impressaoAreaFormSchema = z.object({
  galpao: z.string().min(1, 'Selecione o galpão'),
  ruaInicial: z.string().min(1, 'Informe a rua inicial'),
  ruaFinal: z.string().min(1, 'Informe a rua final'),
  niveis: z.array(z.string()).min(1, 'Selecione ao menos um nível'),
});

export type ImpressaoAreaFormValues = z.infer<typeof impressaoAreaFormSchema>;

export const impressaoResumoSchema = z.object({
  totalEtiquetas: z.number().int().nonnegative(),
  estreiaMediaSegundos: z.number().nonnegative(),
  impressoraOnline: z.boolean(),
  filaPercent: z.number().min(0).max(100),
});

export type ImpressaoResumo = z.infer<typeof impressaoResumoSchema>;

export const LOTE_STATUS_LABELS: Record<LoteEnderecoStatus, string> = {
  pronto: 'Pronto',
  'em-uso': 'Em Uso',
  bloqueado: 'Bloqueado',
};

export const enderecoStatusToLoteStatus: Record<
  EnderecoStatus,
  LoteEnderecoStatus
> = {
  disponivel: 'pronto',
  ocupado: 'em-uso',
  bloqueado: 'bloqueado',
  inventario: 'em-uso',
  inativo: 'bloqueado',
};
