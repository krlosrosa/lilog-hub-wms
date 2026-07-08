export const NOTIFICACAO_DEVOLUCAO_QUEUE = 'notificacao-devolucao' as const;

export const JOB_NOTIFICAR_ANOMALIA_TRANSPORTADORA =
  'notificar-anomalia-transportadora' as const;

export type NotificarAnomaliaJobData = {
  demandaId: string;
  unidadeId: string;
};
