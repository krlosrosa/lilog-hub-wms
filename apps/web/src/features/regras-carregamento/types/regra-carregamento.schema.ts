import { z } from 'zod';

import {
  REGRAS_PRODUTIVIDADE_PAGE_SIZE,
  type FiltroAtivo,
  type RegrasProdutividadeStats,
} from '@/features/config-operacional/types/regra-produtividade-base.schema';

export { REGRAS_PRODUTIVIDADE_PAGE_SIZE as REGRAS_CARREGAMENTO_PAGE_SIZE };
export type { FiltroAtivo, RegrasProdutividadeStats as RegrasCarregamentoStats };

export const regraCarregamentoSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  ativo: z.boolean(),
  padrao: z.boolean(),
  gorduraInicioMinutaSeg: z.number().min(0, 'Valor mínimo: 0'),
  tempoPrimeiroPaleteSeg: z.number().min(0, 'Valor mínimo: 0'),
  tempoDemaisPaletesSeg: z.number().min(0, 'Valor mínimo: 0'),
  tempoPorClienteSeg: z.number().min(0, 'Valor mínimo: 0'),
  tempoPorTabelaSeg: z.number().min(0, 'Valor mínimo: 0'),
  deslocamentoInternoDocaSeg: z.number().min(0, 'Valor mínimo: 0'),
  tempoAmarracaoMinutaSeg: z.number().min(0, 'Valor mínimo: 0'),
  gorduraFimMinutaSeg: z.number().min(0, 'Valor mínimo: 0'),
  atualizadoEm: z.string(),
});

export type RegraCarregamento = z.infer<typeof regraCarregamentoSchema>;

export const regraCarregamentoFormSchema = regraCarregamentoSchema.omit({
  id: true,
  atualizadoEm: true,
});

export type RegraCarregamentoForm = z.infer<typeof regraCarregamentoFormSchema>;

export const DEFAULT_REGRA_CARREGAMENTO_FORM: RegraCarregamentoForm = {
  nome: '',
  descricao: '',
  ativo: true,
  padrao: false,
  gorduraInicioMinutaSeg: 300,
  tempoPrimeiroPaleteSeg: 180,
  tempoDemaisPaletesSeg: 90,
  tempoPorClienteSeg: 60,
  tempoPorTabelaSeg: 45,
  deslocamentoInternoDocaSeg: 120,
  tempoAmarracaoMinutaSeg: 180,
  gorduraFimMinutaSeg: 240,
};

export const PREVIEW_QTD_PALETES = 8;
export const PREVIEW_QTD_CLIENTES = 3;
export const PREVIEW_QTD_TABELAS = 2;
