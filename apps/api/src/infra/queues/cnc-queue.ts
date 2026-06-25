export const CNC_QUEUE = 'cnc' as const;

export const JOB_CRIAR_CNC = 'criar-cnc' as const;

export type CriarCncJobData = {
  recebimentoId: string;
  preRecebimentoId: string;
  unidadeId: string;
  transportadoraId: string;
  responsavelOperacaoId: number;
  userId: number | null;
  divergencias: Array<{
    id: string;
    tipo: string;
    produtoId: string | null;
  }>;
  avarias: Array<{
    id: string;
    natureza: string;
    produtoId: string | null;
  }>;
};
