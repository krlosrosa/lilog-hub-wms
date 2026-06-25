import { z } from 'zod';

import {
  REGRAS_PRODUTIVIDADE_PAGE_SIZE,
  type FiltroAtivo,
  type RegrasProdutividadeStats,
} from '@/features/config-operacional/types/regra-produtividade-base.schema';
import { pausaTipoSchema } from '@/features/pausas/types/pausas.schema';

export { REGRAS_PRODUTIVIDADE_PAGE_SIZE as REGRAS_PAUSAS_PAGE_SIZE };
export type { FiltroAtivo, RegrasProdutividadeStats as RegrasPausasStats };

export const regraPausaSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  ativo: z.boolean(),
  padrao: z.boolean(),
  tipo: pausaTipoSchema,
  intervaloTrabalhoMinutos: z.number().int().min(0, 'Valor mínimo: 0'),
  duracaoPausaMinutos: z.number().int().min(0, 'Valor mínimo: 0'),
  atualizadoEm: z.string(),
});

export type RegraPausa = z.infer<typeof regraPausaSchema>;

export const regraPausaFormSchema = regraPausaSchema.omit({
  id: true,
  atualizadoEm: true,
});

export type RegraPausaForm = z.infer<typeof regraPausaFormSchema>;

export const DEFAULT_REGRA_PAUSA_POR_TIPO: Record<
  RegraPausaForm['tipo'],
  Pick<RegraPausaForm, 'intervaloTrabalhoMinutos' | 'duracaoPausaMinutos'>
> = {
  termica: { intervaloTrabalhoMinutos: 140, duracaoPausaMinutos: 20 },
  refeicao: { intervaloTrabalhoMinutos: 360, duracaoPausaMinutos: 75 },
  outros: { intervaloTrabalhoMinutos: 0, duracaoPausaMinutos: 0 },
};

export function getDefaultRegraPausaForm(tipo: RegraPausaForm['tipo']): RegraPausaForm {
  const defaults = DEFAULT_REGRA_PAUSA_POR_TIPO[tipo];

  return {
    nome: '',
    descricao: '',
    ativo: true,
    padrao: false,
    tipo,
    intervaloTrabalhoMinutos: defaults.intervaloTrabalhoMinutos,
    duracaoPausaMinutos: defaults.duracaoPausaMinutos,
  };
}
