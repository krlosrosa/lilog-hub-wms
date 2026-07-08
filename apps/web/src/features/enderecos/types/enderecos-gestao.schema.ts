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
  'aereo',
  'recebimento',
  'expedicao',
  'avaria',
  'inventario',
  'cross_docking',
  'area_operacional',
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
  aereo: 'Aéreo',
  recebimento: 'Recebimento',
  expedicao: 'Expedição',
  avaria: 'Avaria',
  inventario: 'Inventário',
  cross_docking: 'Cross Docking',
  area_operacional: 'Área Operacional',
};

export const CURVA_ABC_LABELS: Record<CurvaAbc, string> = {
  A: 'Classe A',
  B: 'Classe B',
  C: 'Classe C',
};

export const ENDERECO_TIPOS_ESTRUTURADOS = ['picking', 'pulmao', 'aereo'] as const;

export type EnderecoTipoEstruturado =
  (typeof ENDERECO_TIPOS_ESTRUTURADOS)[number];

export function isEnderecoTipoEstruturado(
  tipo: EnderecoTipo,
): tipo is EnderecoTipoEstruturado {
  return (ENDERECO_TIPOS_ESTRUTURADOS as readonly string[]).includes(tipo);
}

export const ENDERECO_SEGMENTO_REGEX = /^[A-Za-z0-9-]+$/;

const ENDERECO_DEFAULT_RUA = '000';
const ENDERECO_DEFAULT_POSICAO = '0000';
const ENDERECO_DEFAULT_NIVEL = '00';

function normalizeEnderecoSegmento(
  value: string | undefined,
  defaultValue: string,
  padLength: number,
): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed) {
    return defaultValue;
  }

  return trimmed.padStart(padLength, '0');
}

function hasEnderecoEstruturaDetalhada(
  rua?: string,
  posicao?: string,
  nivel?: string,
): boolean {
  return [rua, posicao, nivel].some((value) => (value ?? '').trim() !== '');
}

export function buildEnderecoCodigo(
  zona: string,
  rua?: string,
  posicao?: string,
  nivel?: string,
): string {
  if (!hasEnderecoEstruturaDetalhada(rua, posicao, nivel)) {
    return zona.trim().toUpperCase();
  }

  const ruaNormalizada = normalizeEnderecoSegmento(
    rua,
    ENDERECO_DEFAULT_RUA,
    3,
  );
  const posicaoNormalizada = normalizeEnderecoSegmento(
    posicao,
    ENDERECO_DEFAULT_POSICAO,
    4,
  );
  const nivelNormalizado = normalizeEnderecoSegmento(
    nivel,
    ENDERECO_DEFAULT_NIVEL,
    2,
  );

  return `${zona.trim().toUpperCase()} ${ruaNormalizada} ${posicaoNormalizada} ${nivelNormalizado}`;
}

export function normalizeNivel(nivel: string): string {
  return nivel.trim().padStart(2, '0');
}

export const ENDERECO_TIPOS_ESTRUTURA_RACK = [
  'porta-palete',
  'drive-in',
  'estante-dinamica',
  'flow-rack',
] as const;

export const ENDERECO_TIPOS_ESTRUTURA_OPERACIONAL = [
  'piso',
  'staging',
  'area-delimitada',
  'patio',
] as const;

export type EnderecoTipoEstrutura =
  | (typeof ENDERECO_TIPOS_ESTRUTURA_RACK)[number]
  | (typeof ENDERECO_TIPOS_ESTRUTURA_OPERACIONAL)[number];

export const ENDERECO_TIPO_ESTRUTURA_LABELS: Record<EnderecoTipoEstrutura, string> = {
  'porta-palete': 'Porta-Palete Convencional',
  'drive-in': 'Drive-In',
  'estante-dinamica': 'Estante Dinâmica',
  'flow-rack': 'Flow Rack',
  piso: 'Piso / Chão',
  staging: 'Staging / Triagem',
  'area-delimitada': 'Área Delimitada',
  patio: 'Pátio',
};

export const TIPO_ESTRUTURA_OPCOES = Object.entries(
  ENDERECO_TIPO_ESTRUTURA_LABELS,
).map(([value, label]) => ({
  value: value as EnderecoTipoEstrutura,
  label,
}));

export function isEnderecoTipoEstruturaRack(
  tipoEstrutura: string,
): tipoEstrutura is (typeof ENDERECO_TIPOS_ESTRUTURA_RACK)[number] {
  return (ENDERECO_TIPOS_ESTRUTURA_RACK as readonly string[]).includes(
    tipoEstrutura,
  );
}

export function getTipoEstruturaOpcoes(tipo: EnderecoTipo) {
  const values = isEnderecoTipoEstruturado(tipo)
    ? ENDERECO_TIPOS_ESTRUTURA_RACK
    : ENDERECO_TIPOS_ESTRUTURA_OPERACIONAL;

  return values.map((value) => ({
    value,
    label: ENDERECO_TIPO_ESTRUTURA_LABELS[value],
  }));
}

export function getDefaultTipoEstrutura(tipo: EnderecoTipo): EnderecoTipoEstrutura {
  return isEnderecoTipoEstruturado(tipo) ? 'porta-palete' : 'piso';
}

export const ENDERECO_DIMENSOES_RACK_DEFAULT = {
  larguraMm: 1200,
  alturaMm: 1500,
  profundidadeMm: 1000,
  cargaMaxKg: 1500,
} as const;

export const ENDERECO_DIMENSOES_OPERACIONAL_DEFAULT = {
  larguraMm: 5000,
  alturaMm: 1000,
  profundidadeMm: 5000,
  cargaMaxKg: 5000,
} as const;

export function getDefaultDimensoesEndereco(tipo: EnderecoTipo) {
  return isEnderecoTipoEstruturado(tipo)
    ? ENDERECO_DIMENSOES_RACK_DEFAULT
    : ENDERECO_DIMENSOES_OPERACIONAL_DEFAULT;
}

export function isTipoEstruturaValidoParaEndereco(
  tipo: EnderecoTipo,
  tipoEstrutura: string,
): boolean {
  return isEnderecoTipoEstruturado(tipo)
    ? isEnderecoTipoEstruturaRack(tipoEstrutura)
    : !isEnderecoTipoEstruturaRack(tipoEstrutura);
}
