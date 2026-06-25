import { z } from 'zod';

export const REGRAS_EXPEDICAO_PAGE_SIZE = 10;

export type FiltroAtivo = 'todos' | 'ativo' | 'inativo';

export const regraExpedicaoSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  ativo: z.boolean(),
  padrao: z.boolean(),
  deslocamentoEntreEnderecosSeg: z.number().min(0, 'Valor mínimo: 0'),
  deslocamentoItensSemEnderecoSeg: z.number().min(0, 'Valor mínimo: 0'),
  tempoPrimeiraCaixaSeg: z.number().min(0, 'Valor mínimo: 0'),
  tempoDemaisCaixasSeg: z.number().min(0, 'Valor mínimo: 0'),
  gorduraInicioMapaSeg: z.number().min(0, 'Valor mínimo: 0'),
  gorduraFimMapaSeg: z.number().min(0, 'Valor mínimo: 0'),
  atualizadoEm: z.string(),
});

export type RegraExpedicao = z.infer<typeof regraExpedicaoSchema>;

export const regraExpedicaoFormSchema = regraExpedicaoSchema.omit({
  id: true,
  atualizadoEm: true,
});

export type RegraExpedicaoForm = z.infer<typeof regraExpedicaoFormSchema>;

export const DEFAULT_REGRA_EXPEDICAO_FORM: RegraExpedicaoForm = {
  nome: '',
  descricao: '',
  ativo: true,
  padrao: false,
  deslocamentoEntreEnderecosSeg: 45,
  deslocamentoItensSemEnderecoSeg: 60,
  tempoPrimeiraCaixaSeg: 90,
  tempoDemaisCaixasSeg: 35,
  gorduraInicioMapaSeg: 120,
  gorduraFimMapaSeg: 120,
};

export type RegrasExpedicaoStats = {
  total: number;
  ativas: number;
  perfilPadrao: string | null;
};

export const PREVIEW_QTD_ITENS = 10;
export const PREVIEW_QTD_ENDERECOS = 5;
export const PREVIEW_QTD_ITENS_SEM_ENDERECO = 2;
