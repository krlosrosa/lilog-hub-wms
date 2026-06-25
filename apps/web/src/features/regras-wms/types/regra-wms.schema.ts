import { z } from 'zod';

export const gatilhoRegraSchema = z.enum([
  'recebimento',
  'movimentacao',
  'saida',
  'inventario',
]);

export type GatilhoRegra = z.infer<typeof gatilhoRegraSchema>;

export const operadorLogicoSchema = z.enum(['AND', 'OR']);

export type OperadorLogico = z.infer<typeof operadorLogicoSchema>;

export const campoCondicaoSchema = z.enum([
  'categoria_produto',
  'subcategoria_produto',
  'fornecedor',
  'peso',
  'volume',
  'dias_producao',
  'dias_validade',
  'data_recebimento',
  'quantidade_estoque',
  'nivel_minimo',
  'tipo_endereco',
  'zona_temperatura',
  'situacao_produto',
]);

export type CampoCondicao = z.infer<typeof campoCondicaoSchema>;

export const operadorCondicaoSchema = z.enum([
  'igual',
  'diferente',
  'contem',
  'esta_em',
  'maior_que',
  'menor_que',
  'entre',
]);

export type OperadorCondicao = z.infer<typeof operadorCondicaoSchema>;

export const tipoAcaoSchema = z.enum([
  'mover_deposito',
  'quarentena',
  'bloquear_movimentacao',
  'gerar_alerta',
  'acionar_reposicao',
  'etiqueta_especial',
]);

export type TipoAcao = z.infer<typeof tipoAcaoSchema>;

export const prioridadeAlertaSchema = z.enum(['baixa', 'media', 'alta']);

export type PrioridadeAlerta = z.infer<typeof prioridadeAlertaSchema>;

export const filtroGatilhoSchema = z.enum([
  'todos',
  'recebimento',
  'movimentacao',
  'saida',
  'inventario',
]);

export type FiltroGatilho = z.infer<typeof filtroGatilhoSchema>;

export const filtroAtivoSchema = z.enum(['todos', 'ativo', 'inativo']);

export type FiltroAtivo = z.infer<typeof filtroAtivoSchema>;

export const condicaoSchema = z.object({
  id: z.string(),
  campo: campoCondicaoSchema,
  operador: operadorCondicaoSchema,
  valor: z.string().min(1, 'Informe o valor'),
  valorFim: z.string().optional(),
});

export type Condicao = z.infer<typeof condicaoSchema>;

export const acaoParametrosSchema = z.object({
  zonaDestino: z.string().optional(),
  mensagem: z.string().optional(),
  prioridade: prioridadeAlertaSchema.optional(),
  motivo: z.string().optional(),
});

export type AcaoParametros = z.infer<typeof acaoParametrosSchema>;

export const acaoSchema = z.object({
  tipo: tipoAcaoSchema,
  parametros: acaoParametrosSchema,
});

export type Acao = z.infer<typeof acaoSchema>;

export const regraWmsSchema = z.object({
  id: z.string(),
  nome: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  descricao: z.string().optional(),
  ativo: z.boolean(),
  prioridade: z.number().int().min(1).max(100),
  gatilho: gatilhoRegraSchema,
  operadorLogico: operadorLogicoSchema,
  condicoes: z.array(condicaoSchema).min(1, 'Adicione ao menos uma condição'),
  acao: acaoSchema,
  criadoEm: z.string(),
  atualizadoEm: z.string(),
});

export type RegraWms = z.infer<typeof regraWmsSchema>;

export const regraWmsFormSchema = regraWmsSchema.omit({
  id: true,
  criadoEm: true,
  atualizadoEm: true,
});

export type RegraWmsForm = z.infer<typeof regraWmsFormSchema>;

export const regrasWmsStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  ativas: z.number().int().nonnegative(),
  inativas: z.number().int().nonnegative(),
  conflitosPotenciais: z.number().int().nonnegative(),
});

export type RegrasWmsStats = z.infer<typeof regrasWmsStatsSchema>;

export const GATILHO_LABELS: Record<GatilhoRegra, string> = {
  recebimento: 'Recebimento',
  movimentacao: 'Movimentação',
  saida: 'Saída',
  inventario: 'Inventário',
};

export const FILTRO_GATILHO_LABELS: Record<FiltroGatilho, string> = {
  todos: 'Todos',
  recebimento: 'Recebimento',
  movimentacao: 'Movimentação',
  saida: 'Saída',
  inventario: 'Inventário',
};

export const OPERADOR_LOGICO_LABELS: Record<OperadorLogico, string> = {
  AND: 'E (todas)',
  OR: 'OU (qualquer)',
};

export const CAMPO_CONDICAO_LABELS: Record<CampoCondicao, string> = {
  categoria_produto: 'Categoria do produto',
  subcategoria_produto: 'Subcategoria do produto',
  fornecedor: 'Fornecedor',
  peso: 'Peso (kg)',
  volume: 'Volume (m³)',
  dias_producao: 'Dias de produção',
  dias_validade: 'Dias de validade',
  data_recebimento: 'Data de recebimento',
  quantidade_estoque: 'Quantidade em estoque',
  nivel_minimo: 'Nível mínimo',
  tipo_endereco: 'Tipo de endereço',
  zona_temperatura: 'Zona de temperatura',
  situacao_produto: 'Situação do produto',
};

export const CAMPO_CONDICAO_GRUPOS: Record<
  string,
  readonly CampoCondicao[]
> = {
  Produto: [
    'categoria_produto',
    'subcategoria_produto',
    'fornecedor',
    'peso',
    'volume',
  ],
  Temporal: ['dias_producao', 'dias_validade', 'data_recebimento'],
  Estoque: [
    'quantidade_estoque',
    'nivel_minimo',
    'tipo_endereco',
    'zona_temperatura',
  ],
  'Estado físico': ['situacao_produto'],
};

export const OPERADOR_CONDICAO_LABELS: Record<OperadorCondicao, string> = {
  igual: 'Igual a',
  diferente: 'Diferente de',
  contem: 'Contém',
  esta_em: 'Está em',
  maior_que: 'Maior que',
  menor_que: 'Menor que',
  entre: 'Entre',
};

export const TIPO_ACAO_LABELS: Record<TipoAcao, string> = {
  mover_deposito: 'Mover para depósito',
  quarentena: 'Enviar para quarentena',
  bloquear_movimentacao: 'Bloquear movimentação',
  gerar_alerta: 'Gerar alerta',
  acionar_reposicao: 'Acionar reposição',
  etiqueta_especial: 'Etiqueta especial',
};

export const PRIORIDADE_ALERTA_LABELS: Record<PrioridadeAlerta, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

export const CAMPOS_NUMERICOS: readonly CampoCondicao[] = [
  'peso',
  'volume',
  'dias_producao',
  'dias_validade',
  'quantidade_estoque',
  'nivel_minimo',
];

export const CAMPOS_DATA: readonly CampoCondicao[] = ['data_recebimento'];

export const CAMPOS_SELECT: Partial<
  Record<CampoCondicao, readonly { value: string; label: string }[]>
> = {
  zona_temperatura: [
    { value: 'seco', label: 'Seco' },
    { value: 'resfriado', label: 'Resfriado' },
    { value: 'congelado', label: 'Congelado' },
  ],
  situacao_produto: [
    { value: 'integro', label: 'Íntegro' },
    { value: 'avariado', label: 'Avariado' },
    { value: 'devolvido', label: 'Devolvido' },
    { value: 'quarentena', label: 'Quarentena' },
  ],
  tipo_endereco: [
    { value: 'picking', label: 'Picking' },
    { value: 'armazenagem', label: 'Armazenagem' },
    { value: 'staging', label: 'Staging' },
    { value: 'quarentena', label: 'Quarentena' },
    { value: 'aereo', label: 'Aéreo' },
  ],
  categoria_produto: [
    { value: 'laticinios', label: 'Laticínios' },
    { value: 'bebidas', label: 'Bebidas' },
    { value: 'congelados', label: 'Congelados' },
    { value: 'higiene', label: 'Higiene' },
    { value: 'importado', label: 'Importado' },
  ],
};

export const ZONAS_DESTINO = [
  'Quarentena',
  'Depósito A',
  'Depósito B',
  'Área de bloqueio',
  'Staging expedição',
] as const;

export const REGRAS_WMS_PAGE_SIZE = 10;

export function getOperadoresForCampo(
  campo: CampoCondicao,
): OperadorCondicao[] {
  if (CAMPOS_NUMERICOS.includes(campo)) {
    return ['igual', 'maior_que', 'menor_que', 'entre'];
  }
  if (CAMPOS_DATA.includes(campo)) {
    return ['igual', 'maior_que', 'menor_que', 'entre'];
  }
  if (CAMPOS_SELECT[campo]) {
    return ['igual', 'diferente', 'esta_em'];
  }
  return ['igual', 'diferente', 'contem', 'esta_em'];
}

export function getCampoInputType(
  campo: CampoCondicao,
): 'text' | 'number' | 'date' | 'select' {
  if (CAMPOS_NUMERICOS.includes(campo)) return 'number';
  if (CAMPOS_DATA.includes(campo)) return 'date';
  if (CAMPOS_SELECT[campo]) return 'select';
  return 'text';
}

export function createEmptyCondicao(): Condicao {
  return {
    id: crypto.randomUUID(),
    campo: 'categoria_produto',
    operador: 'igual',
    valor: '',
  };
}

export const DEFAULT_REGRA_WMS_FORM: RegraWmsForm = {
  nome: '',
  descricao: '',
  ativo: true,
  prioridade: 50,
  gatilho: 'recebimento',
  operadorLogico: 'AND',
  condicoes: [createEmptyCondicao()],
  acao: {
    tipo: 'quarentena',
    parametros: {
      zonaDestino: 'Quarentena',
      motivo: '',
    },
  },
};
