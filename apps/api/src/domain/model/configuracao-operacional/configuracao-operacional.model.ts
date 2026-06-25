import { z } from 'zod';

export const DOMINIO_EXPEDICAO = 'expedicao' as const;
export const DOMINIO_OPERACIONAL = 'operacional' as const;
export const CATEGORIA_PRODUTIVIDADE = 'produtividade' as const;
export const CATEGORIA_PAUSAS = 'pausas' as const;

export const SUBTIPO_SEPARACAO = 'separacao' as const;
export const SUBTIPO_CONFERENCIA = 'conferencia' as const;
export const SUBTIPO_CARREGAMENTO = 'carregamento' as const;

export const SUBTIPO_PAUSA_TERMICA = 'termica' as const;
export const SUBTIPO_PAUSA_REFEICAO = 'refeicao' as const;
export const SUBTIPO_PAUSA_OUTROS = 'outros' as const;

export const SubtipoConfiguracaoOperacionalSchema = z.enum([
  SUBTIPO_SEPARACAO,
  SUBTIPO_CONFERENCIA,
  SUBTIPO_CARREGAMENTO,
]);

export const SubtipoPausaSchema = z.enum([
  SUBTIPO_PAUSA_TERMICA,
  SUBTIPO_PAUSA_REFEICAO,
  SUBTIPO_PAUSA_OUTROS,
]);

export type SubtipoConfiguracaoOperacional = z.infer<
  typeof SubtipoConfiguracaoOperacionalSchema
>;

export type SubtipoPausa = z.infer<typeof SubtipoPausaSchema>;

export type SubtipoConfiguracao =
  | SubtipoConfiguracaoOperacional
  | SubtipoPausa;

export const SubtipoConfiguracaoSchema = z.union([
  SubtipoConfiguracaoOperacionalSchema,
  SubtipoPausaSchema,
]);

export const ParametrosSeparacaoSchema = z.object({
  deslocamentoEntreEnderecosSeg: z.number().min(0),
  deslocamentoItensSemEnderecoSeg: z.number().min(0).default(0),
  tempoPrimeiraCaixaSeg: z.number().min(0),
  tempoDemaisCaixasSeg: z.number().min(0),
  gorduraInicioMapaSeg: z.number().min(0),
  gorduraFimMapaSeg: z.number().min(0),
});

export const ParametrosConferenciaSchema = z.object({
  gorduraInicioMapaSeg: z.number().min(0),
  tempoPrimeiroItemSeg: z.number().min(0),
  tempoDemaisItensSeg: z.number().min(0),
  tempoPorPaleteSeg: z.number().min(0),
  tempoPorClienteSeg: z.number().min(0),
  gorduraFimMapaSeg: z.number().min(0),
});

export const ParametrosCarregamentoSchema = z.object({
  gorduraInicioMinutaSeg: z.number().min(0),
  tempoPrimeiroPaleteSeg: z.number().min(0),
  tempoDemaisPaletesSeg: z.number().min(0),
  tempoPorClienteSeg: z.number().min(0),
  tempoPorTabelaSeg: z.number().min(0),
  deslocamentoInternoDocaSeg: z.number().min(0),
  tempoAmarracaoMinutaSeg: z.number().min(0),
  gorduraFimMinutaSeg: z.number().min(0),
});

export const ParametrosPausaSchema = z.object({
  intervaloTrabalhoMinutos: z.number().int().min(0),
  duracaoPausaMinutos: z.number().int().min(0),
});

export type ParametrosSeparacao = z.infer<typeof ParametrosSeparacaoSchema>;
export type ParametrosConferencia = z.infer<typeof ParametrosConferenciaSchema>;
export type ParametrosCarregamento = z.infer<typeof ParametrosCarregamentoSchema>;
export type ParametrosPausa = z.infer<typeof ParametrosPausaSchema>;

export type ParametrosConfiguracaoOperacional =
  | ParametrosSeparacao
  | ParametrosConferencia
  | ParametrosCarregamento
  | ParametrosPausa;

export type RegrasPausaPadraoMap = Partial<
  Record<SubtipoPausa, ParametrosPausa>
>;

const PARAMETROS_PRODUTIVIDADE_POR_SUBTIPO = {
  [SUBTIPO_SEPARACAO]: ParametrosSeparacaoSchema,
  [SUBTIPO_CONFERENCIA]: ParametrosConferenciaSchema,
  [SUBTIPO_CARREGAMENTO]: ParametrosCarregamentoSchema,
} as const;

const PARAMETROS_PAUSA_POR_SUBTIPO = {
  [SUBTIPO_PAUSA_TERMICA]: ParametrosPausaSchema,
  [SUBTIPO_PAUSA_REFEICAO]: ParametrosPausaSchema,
  [SUBTIPO_PAUSA_OUTROS]: ParametrosPausaSchema,
} as const;

export function isSubtipoPausa(subtipo: string): subtipo is SubtipoPausa {
  return SubtipoPausaSchema.safeParse(subtipo).success;
}

export function isSubtipoProdutividade(
  subtipo: string,
): subtipo is SubtipoConfiguracaoOperacional {
  return SubtipoConfiguracaoOperacionalSchema.safeParse(subtipo).success;
}

export function validarParametrosConfig(
  categoria: string,
  subtipo: string,
  parametros: unknown,
): string | null {
  if (categoria === CATEGORIA_PAUSAS) {
    if (!isSubtipoPausa(subtipo)) {
      return `Subtipo de pausa inválido: "${subtipo}"`;
    }

    const result = PARAMETROS_PAUSA_POR_SUBTIPO[subtipo].safeParse(parametros);

    if (!result.success) {
      return `Parâmetros inválidos para pausa "${subtipo}": ${result.error.message}`;
    }

    return null;
  }

  if (categoria === CATEGORIA_PRODUTIVIDADE) {
    if (!isSubtipoProdutividade(subtipo)) {
      return `Subtipo de produtividade inválido: "${subtipo}"`;
    }

    const result =
      PARAMETROS_PRODUTIVIDADE_POR_SUBTIPO[subtipo].safeParse(parametros);

    if (!result.success) {
      return `Parâmetros inválidos para subtipo "${subtipo}": ${result.error.message}`;
    }

    return null;
  }

  return `Categoria de configuração não suportada: "${categoria}"`;
}

export function parseParametrosConfig(
  categoria: string,
  subtipo: string,
  parametros: unknown,
): ParametrosConfiguracaoOperacional {
  const erro = validarParametrosConfig(categoria, subtipo, parametros);

  if (erro) {
    throw new Error(erro);
  }

  if (categoria === CATEGORIA_PAUSAS && isSubtipoPausa(subtipo)) {
    return PARAMETROS_PAUSA_POR_SUBTIPO[subtipo].parse(parametros);
  }

  if (categoria === CATEGORIA_PRODUTIVIDADE && isSubtipoProdutividade(subtipo)) {
    return PARAMETROS_PRODUTIVIDADE_POR_SUBTIPO[subtipo].parse(parametros);
  }

  throw new Error(`Categoria de configuração não suportada: "${categoria}"`);
}

/** @deprecated Use validarParametrosConfig */
export function validarParametrosPorSubtipo(
  subtipo: SubtipoConfiguracaoOperacional,
  parametros: unknown,
): string | null {
  return validarParametrosConfig(CATEGORIA_PRODUTIVIDADE, subtipo, parametros);
}

/** @deprecated Use parseParametrosConfig */
export function parseParametrosPorSubtipo(
  subtipo: SubtipoConfiguracaoOperacional,
  parametros: unknown,
): ParametrosSeparacao | ParametrosConferencia | ParametrosCarregamento {
  return parseParametrosConfig(
    CATEGORIA_PRODUTIVIDADE,
    subtipo,
    parametros,
  ) as ParametrosSeparacao | ParametrosConferencia | ParametrosCarregamento;
}

export const CreateConfiguracaoOperacionalInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  dominio: z.string().min(1).max(50),
  categoria: z.string().min(1).max(50),
  subtipo: SubtipoConfiguracaoSchema,
  nome: z.string().min(1).max(120),
  descricao: z.string().optional(),
  parametros: z.record(z.string(), z.unknown()),
  versaoSchema: z.number().int().min(1).max(32767).optional().default(1),
  isPadrao: z.boolean().optional().default(false),
  ativo: z.boolean().optional().default(true),
  criadoPor: z.number().int().positive().optional(),
});

export type CreateConfiguracaoOperacionalInput = z.infer<
  typeof CreateConfiguracaoOperacionalInputSchema
>;

export const UpdateConfiguracaoOperacionalInputSchema = z.object({
  nome: z.string().min(1).max(120).optional(),
  descricao: z.string().nullable().optional(),
  parametros: z.record(z.string(), z.unknown()).optional(),
  versaoSchema: z.number().int().min(1).max(32767).optional(),
  isPadrao: z.boolean().optional(),
  ativo: z.boolean().optional(),
});

export type UpdateConfiguracaoOperacionalInput = z.infer<
  typeof UpdateConfiguracaoOperacionalInputSchema
>;
