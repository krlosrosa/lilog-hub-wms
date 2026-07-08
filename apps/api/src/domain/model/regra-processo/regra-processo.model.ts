import { z } from 'zod';

export const GatilhoRegraSchema = z.enum([
  'recebimento',
  'movimentacao',
  'saida',
  'inventario',
]);

export type GatilhoRegra = z.infer<typeof GatilhoRegraSchema>;

export const ModoAvaliacaoRegraSchema = z.enum([
  'parar_no_primeiro_match',
  'acumular_matches',
]);

export type ModoAvaliacaoRegra = z.infer<typeof ModoAvaliacaoRegraSchema>;

export const GrupoOperadorSchema = z.enum(['all', 'any', 'not']);

export type GrupoOperador = z.infer<typeof GrupoOperadorSchema>;

export const CampoCondicaoSchema = z.enum([
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
  'tipo_divergencia',
  'grupo_produto',
  'produto_id',
  'shelf_life',
  'percentual_validade_restante',
]);

export type CampoCondicao = z.infer<typeof CampoCondicaoSchema>;

export const OperadorCondicaoSchema = z.enum([
  'igual',
  'diferente',
  'contem',
  'esta_em',
  'maior_que',
  'menor_que',
  'entre',
]);

export type OperadorCondicao = z.infer<typeof OperadorCondicaoSchema>;

export const TipoAcaoRegraSchema = z.enum([
  'mover_deposito',
  'quarentena',
  'bloquear_movimentacao',
  'gerar_alerta',
  'acionar_reposicao',
  'etiqueta_especial',
]);

export type TipoAcaoRegra = z.infer<typeof TipoAcaoRegraSchema>;

export const AcaoRegraParametrosSchema = z.object({
  depositoId: z.uuid().optional(),
  depositoCodigo: z.string().optional(),
  zonaDestino: z.string().optional(),
  mensagem: z.string().optional(),
  prioridade: z.enum(['baixa', 'media', 'alta']).optional(),
  motivo: z.string().optional(),
});

export type AcaoRegraParametros = z.infer<typeof AcaoRegraParametrosSchema>;

export const AcaoRegraSchema = z.object({
  tipo: TipoAcaoRegraSchema,
  parametros: AcaoRegraParametrosSchema,
});

export type AcaoRegra = z.infer<typeof AcaoRegraSchema>;

export const CondicaoFolhaSchema = z.object({
  tipo: z.literal('condicao'),
  id: z.string(),
  campo: CampoCondicaoSchema,
  operador: OperadorCondicaoSchema,
  valor: z.string().min(1),
  valorFim: z.string().optional(),
});

export type CondicaoFolha = z.infer<typeof CondicaoFolhaSchema>;

export type GrupoCondicoes = {
  tipo: 'grupo';
  id: string;
  operador: GrupoOperador;
  filhos: NoCondicao[];
};

export type NoCondicao = CondicaoFolha | GrupoCondicoes;

export type ArvoreCondicoes = {
  operador: GrupoOperador;
  filhos: NoCondicao[];
};

export const noCondicaoSchema: z.ZodType<NoCondicao> = z.lazy(() =>
  z.union([
    CondicaoFolhaSchema,
    z.object({
      tipo: z.literal('grupo'),
      id: z.string(),
      operador: GrupoOperadorSchema,
      filhos: z.array(noCondicaoSchema).min(1),
    }),
  ]),
);

export const ArvoreCondicoesSchema = z.object({
  operador: GrupoOperadorSchema,
  filhos: z.array(noCondicaoSchema).min(1),
});

export const CreateRegraProcessoInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  nome: z.string().min(1).max(100),
  descricao: z.string().optional(),
  gatilho: GatilhoRegraSchema,
  prioridade: z.number().int().min(1).max(100).default(10),
  modoAvaliacao: ModoAvaliacaoRegraSchema.default('parar_no_primeiro_match'),
  arvoreCondicoes: ArvoreCondicoesSchema,
  acoes: z.array(AcaoRegraSchema).min(1),
  ativo: z.boolean().default(true),
});

export type CreateRegraProcessoInput = z.infer<
  typeof CreateRegraProcessoInputSchema
>;

export const UpdateRegraProcessoInputSchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  descricao: z.string().optional(),
  gatilho: GatilhoRegraSchema.optional(),
  prioridade: z.number().int().min(1).max(100).optional(),
  modoAvaliacao: ModoAvaliacaoRegraSchema.optional(),
  arvoreCondicoes: ArvoreCondicoesSchema.optional(),
  acoes: z.array(AcaoRegraSchema).min(1).optional(),
  ativo: z.boolean().optional(),
});

export type UpdateRegraProcessoInput = z.infer<
  typeof UpdateRegraProcessoInputSchema
>;

export const RegraProcessoSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string(),
  nome: z.string(),
  descricao: z.string().nullable(),
  gatilho: GatilhoRegraSchema,
  prioridade: z.number().int(),
  modoAvaliacao: ModoAvaliacaoRegraSchema,
  arvoreCondicoes: ArvoreCondicoesSchema,
  acoes: z.array(AcaoRegraSchema),
  ativo: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type RegraProcesso = z.infer<typeof RegraProcessoSchema>;
