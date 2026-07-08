import { z } from 'zod';

export const devolucaoFaltaPesoTratativaContabilSchema = z.enum([
  'diferenca_peso',
]);

export type DevolucaoFaltaPesoTratativaContabil = z.infer<
  typeof devolucaoFaltaPesoTratativaContabilSchema
>;

export const devolucaoFaltaPesoStatusSchema = z.enum([
  'pendente',
  'validada',
  'rejeitada',
]);

export type DevolucaoFaltaPesoStatus = z.infer<
  typeof devolucaoFaltaPesoStatusSchema
>;

export const faltaPesoDetalheSchema = z.object({
  id: z.string().uuid(),
  demandaId: z.string().uuid(),
  notaFiscalId: z.string().uuid(),
  itemId: z.string().uuid(),
  sku: z.string(),
  descricaoProduto: z.string().nullable(),
  pesoVariavel: z.boolean(),
  pesoEsperadoKg: z.number().nonnegative(),
  pesoDevolvidoKg: z.number().nonnegative(),
  pesoFaltanteKg: z.number().nonnegative(),
  quantidadeFiscalOriginal: z.number().nullable(),
  quantidadeContabilConsiderada: z.number().nonnegative(),
  tratativaContabil: devolucaoFaltaPesoTratativaContabilSchema,
  zerarQuantidadeContabil: z.boolean(),
  motivo: z.string().nullable(),
  observacao: z.string().nullable(),
  status: devolucaoFaltaPesoStatusSchema,
  registradoPorUserId: z.number().int().nullable(),
  registradoEm: z.string(),
  validadoPorUserId: z.number().int().nullable(),
  validadoEm: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FaltaPesoDetalhe = z.infer<typeof faltaPesoDetalheSchema>;

export type ListarFaltasPesoResponse = {
  faltasPeso: FaltaPesoDetalhe[];
};

export type RegistrarFaltaPesoPayload = {
  unidadeId: string;
  notaFiscalId: string;
  itemId: string;
  sku: string;
  diferencaKg: number;
  zerarQuantidadeContabil?: boolean;
  observacao?: string | null;
};

export type AtualizarFaltaPesoPayload = {
  unidadeId: string;
  diferencaKg: number;
  zerarQuantidadeContabil: boolean;
  observacao?: string | null;
};

export const MOTIVO_FALTA_PESO_DEVOLUCAO = 'Diferença de peso na entrega';

export type RegistrarFaltaPesoResponse = {
  id: string;
  demandaId: string;
  itemId: string;
  pesoFaltanteKg: number;
  quantidadeFiscalOriginal: number | null;
  quantidadeContabilConsiderada: number;
  tratativaContabil: DevolucaoFaltaPesoTratativaContabil;
  zerarQuantidadeContabil: boolean;
  status: DevolucaoFaltaPesoStatus;
};

export type ValidarFaltaPesoPayload = {
  unidadeId: string;
  status: Extract<DevolucaoFaltaPesoStatus, 'validada' | 'rejeitada'>;
};

export const FALTA_PESO_STATUS_LABELS: Record<DevolucaoFaltaPesoStatus, string> =
  {
    pendente: 'Pendente validação',
    validada: 'Validada',
    rejeitada: 'Rejeitada',
  };
