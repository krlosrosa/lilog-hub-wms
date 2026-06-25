import { z } from 'zod';

export const prioridadeSchema = z.enum(['alta', 'media', 'baixa']);

export type Prioridade = z.infer<typeof prioridadeSchema>;

export const prioridadeFilterSchema = z.enum(['todas', 'alta', 'media', 'baixa']);

export type PrioridadeFilter = z.infer<typeof prioridadeFilterSchema>;

export const tarefaSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  prioridade: prioridadeSchema,
  origem: z.string(),
  item: z.string(),
  qty: z.number().int().positive(),
  timeLeft: z.string().optional(),
  footerLabel: z.string().optional(),
  destino: z.string(),
  destinoQrExpected: z.string(),
  sscc: z.string(),
  produto: z.string(),
  qtyLabel: z.string(),
  pesoTotal: z.string(),
  sku: z.string(),
  lote: z.string(),
  skuNome: z.string(),
  skuDescricao: z.string(),
  skuQty: z.number().int().positive(),
  tags: z.array(z.string()).optional(),
});

export type Tarefa = z.infer<typeof tarefaSchema>;

export const confirmacaoColetaSchema = z.object({
  enderecoOrigem: z.string().min(1, 'Escaneie o endereço de origem'),
  lpn: z.string().min(6, 'Escaneie o LPN do palete'),
});

export type ConfirmacaoColetaForm = z.infer<typeof confirmacaoColetaSchema>;

export const direcionamentoSchema = z.object({
  destinoQrCode: z.string().min(1, 'Escaneie o QR Code da posição'),
});

export type DirecionamentoForm = z.infer<typeof direcionamentoSchema>;
