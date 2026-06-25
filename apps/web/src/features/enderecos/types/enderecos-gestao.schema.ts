import { z } from 'zod';

export const enderecoStatusSchema = z.enum([
  'disponivel',
  'ocupado',
  'bloqueado',
  'inventario',
  'inativo',
]);

export type EnderecoStatus = z.infer<typeof enderecoStatusSchema>;

export const curvaAbcSchema = z.enum(['A', 'B', 'C']);

export type CurvaAbc = z.infer<typeof curvaAbcSchema>;

export const enderecoTipoSchema = z.enum([
  'picking',
  'pulmao',
  'recebimento',
  'expedicao',
  'avaria',
  'inventario',
  'cross_docking',
  'doca',
]);

export type EnderecoTipo = z.infer<typeof enderecoTipoSchema>;

export const enderecoListaItemSchema = z.object({
  id: z.string(),
  enderecoId: z.string(),
  zona: z.string(),
  rua: z.string(),
  posicao: z.string(),
  nivel: z.string(),
  tipo: enderecoTipoSchema,
  status: enderecoStatusSchema,
  capacidadeKg: z.number().positive(),
  ocupacaoPercent: z.number().min(0).max(100),
  curvaAbc: curvaAbcSchema,
});

export type EnderecoListaItem = z.infer<typeof enderecoListaItemSchema>;

export const enderecoKpiSchema = z.object({
  totalEnderecos: z.number().int().nonnegative(),
  totalEnderecosTrendPercent: z.number(),
  ocupacaoGlobalPercent: z.number().min(0).max(100),
  posicoesBloqueadas: z.number().int().nonnegative(),
  crossDockingAtivos: z.number().int().nonnegative(),
  enderecosDisponiveis: z.number().int().nonnegative().optional(),
  enderecosOcupados: z.number().int().nonnegative().optional(),
  taxaOcupacaoGeral: z.number().min(0).max(100).optional(),
});

export type EnderecoKpi = z.infer<typeof enderecoKpiSchema>;

export const enderecoFiltrosSchema = z.object({
  zonas: z.array(z.string()),
  niveis: z.array(z.string()),
  tipos: z.array(enderecoTipoSchema),
  status: z.array(enderecoStatusSchema),
});

export type EnderecoFiltros = z.infer<typeof enderecoFiltrosSchema>;

export const ENDERECO_STATUS_LABELS: Record<EnderecoStatus, string> = {
  disponivel: 'Disponível',
  ocupado: 'Ocupado',
  bloqueado: 'Bloqueado',
  inventario: 'Inventário',
  inativo: 'Inativo',
};

export const ENDERECO_TIPO_LABELS: Record<EnderecoTipo, string> = {
  picking: 'Picking',
  pulmao: 'Pulmão',
  recebimento: 'Recebimento',
  expedicao: 'Expedição',
  avaria: 'Avaria',
  inventario: 'Inventário',
  cross_docking: 'Cross Docking',
  doca: 'Doca',
};

export const CURVA_ABC_LABELS: Record<CurvaAbc, string> = {
  A: 'Classe A',
  B: 'Classe B',
  C: 'Classe C',
};

export function buildEnderecoCodigo(
  zona: string,
  rua: string,
  posicao: string,
  nivel: string,
): string {
  return `${zona.trim().toUpperCase()} ${rua.trim().padStart(4, '0')} ${posicao.trim().padStart(3, '0')} ${nivel.trim().padStart(2, '0')}`;
}

export function normalizeNivel(nivel: string): string {
  return nivel.trim().padStart(2, '0');
}
