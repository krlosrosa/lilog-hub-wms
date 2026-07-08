export const INVENTARIO_DIVERGENCIA_QUEUE = 'inventario-divergencia' as const;

export const JOB_APLICAR_DIVERGENCIA = 'aplicar-divergencia' as const;

export type AplicarDivergenciaJobData = {
  divergenciaId: string;
  operatorId: number | null;
};
