import { z } from 'zod';

import type { EmpresaCodigo } from '@/features/filiais/types/centro-cadastro.schema';

export const clusterValues = ['Cross', 'CD-Fabrica', 'Distribuicao'] as const;
export type ClusterValue = (typeof clusterValues)[number];

export const CLUSTER_OPTIONS = [
  { value: 'Cross' as const, label: 'Cross' },
  { value: 'CD-Fabrica' as const, label: 'CD-Fábrica' },
  { value: 'Distribuicao' as const, label: 'Distribuição' },
] as const;

export const filialFormSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, 'Informe o código da unidade')
    .max(50, 'O código deve ter no máximo 50 caracteres'),
  nome: z.string().trim().min(1, 'Informe o nome da unidade'),
  cluster: z.enum(clusterValues, { message: 'Selecione um cluster' }),
  nomeFilial: z.string().trim().min(1, 'Informe o nome da filial'),
});

export type FilialFormValues = z.infer<typeof filialFormSchema>;

export type CentroAtrelado = {
  id: string;
  centro: string;
  nome: string;
  empresa: EmpresaCodigo;
};
