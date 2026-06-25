import { z } from 'zod';

import {
  REGRAS_PRODUTIVIDADE_PAGE_SIZE,
  type FiltroAtivo,
  type RegrasProdutividadeStats,
} from '@/features/config-operacional/types/regra-produtividade-base.schema';

export { REGRAS_PRODUTIVIDADE_PAGE_SIZE as REGRAS_CONFERENCIA_PAGE_SIZE };
export type { FiltroAtivo, RegrasProdutividadeStats as RegrasConferenciaStats };

export const regraConferenciaSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  ativo: z.boolean(),
  padrao: z.boolean(),
  gorduraInicioMapaSeg: z.number().min(0, 'Valor mínimo: 0'),
  tempoPrimeiroItemSeg: z.number().min(0, 'Valor mínimo: 0'),
  tempoDemaisItensSeg: z.number().min(0, 'Valor mínimo: 0'),
  tempoPorPaleteSeg: z.number().min(0, 'Valor mínimo: 0'),
  tempoPorClienteSeg: z.number().min(0, 'Valor mínimo: 0'),
  gorduraFimMapaSeg: z.number().min(0, 'Valor mínimo: 0'),
  atualizadoEm: z.string(),
});

export type RegraConferencia = z.infer<typeof regraConferenciaSchema>;

export const regraConferenciaFormSchema = regraConferenciaSchema.omit({
  id: true,
  atualizadoEm: true,
});

export type RegraConferenciaForm = z.infer<typeof regraConferenciaFormSchema>;

export const DEFAULT_REGRA_CONFERENCIA_FORM: RegraConferenciaForm = {
  nome: '',
  descricao: '',
  ativo: true,
  padrao: false,
  gorduraInicioMapaSeg: 60,
  tempoPrimeiroItemSeg: 45,
  tempoDemaisItensSeg: 20,
  tempoPorPaleteSeg: 30,
  tempoPorClienteSeg: 25,
  gorduraFimMapaSeg: 60,
};

export const PREVIEW_QTD_LINHAS = 10;
export const PREVIEW_QTD_PALETES = 3;
export const PREVIEW_QTD_CLIENTES = 2;
