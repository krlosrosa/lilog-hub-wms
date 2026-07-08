export const ARMAZENAGEM_QUEUE = 'armazenagem' as const;

export const JOB_PROCESSAR_SALDO_ITEM = 'processar-saldo-item' as const;
export const JOB_PROCESSAR_SALDO_TAREFA = 'processar-saldo-tarefa' as const;

export type ProcessarSaldoItemJobData = {
  unidadeId: string;
  itemId: string;
  enderecoConfirmadoId: string;
  operatorId: number | null;
};

export type ProcessarSaldoTarefaJobData = {
  unidadeId: string;
  tarefaId: string;
  enderecoConfirmadoId: string;
  operatorId: number | null;
};
