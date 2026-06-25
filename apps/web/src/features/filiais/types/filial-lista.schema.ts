import { z } from 'zod';

import { clusterValues } from '@/features/filiais/types/filial.schema';

export const ClusterFilialSchema = z.enum(clusterValues);
export type ClusterFilial = z.infer<typeof ClusterFilialSchema>;

export const filialListaItemSchema = z.object({
  id: z.string(),
  nome: z.string(),
  nomeFilial: z.string(),
  cluster: ClusterFilialSchema,
  centrosCount: z.number().int().min(0),
});

export type FilialListaItem = z.infer<typeof filialListaItemSchema>;

export const FiltroClusterSchema = z.enum(['todos', ...clusterValues]);
export type FiltroCluster = z.infer<typeof FiltroClusterSchema>;

export const FILTRO_CLUSTER_LABELS: Record<FiltroCluster, string> = {
  todos: 'Todos',
  Cross: 'Cross',
  'CD-Fabrica': 'CD-Fábrica',
  Distribuicao: 'Distribuição',
};
