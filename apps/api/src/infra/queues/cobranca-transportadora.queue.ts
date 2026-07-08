export const COBRANCA_TRANSPORTADORA_QUEUE =
  'cobranca-transportadora' as const;

export const JOB_GERAR_PROCESSO_DEBITO = 'gerar-processo-debito' as const;

export type GerarProcessoDebitoJobData = {
  demandaId: string;
  unidadeId: string;
};
