export const RECEBIMENTO_QUEUE = 'recebimento' as const;

export const JOB_PROCESSAR_SALDO_RECEBIMENTO =
  'processar-saldo-recebimento' as const;

export type LinhaSaldoRecebimentoJobData = {
  produtoId: string;
  quantidade: number;
  unidadeMedida: string;
  lote: string | null;
  validade: string | null;
  numeroSerie: string | null;
  status: 'liberado' | 'bloqueado';
  tipoAnomalia: 'sobra' | 'produto_nao_esperado' | 'avaria' | null;
};

export type ProcessarSaldoRecebimentoJobData = {
  recebimentoId: string;
  unidadeId: string;
  userId: number | null;
  linhas: LinhaSaldoRecebimentoJobData[];
};
