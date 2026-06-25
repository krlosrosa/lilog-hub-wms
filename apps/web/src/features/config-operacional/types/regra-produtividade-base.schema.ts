export type FiltroAtivo = 'todos' | 'ativo' | 'inativo';

export type RegrasProdutividadeStats = {
  total: number;
  ativas: number;
  perfilPadrao: string | null;
};

export const REGRAS_PRODUTIVIDADE_PAGE_SIZE = 10;
