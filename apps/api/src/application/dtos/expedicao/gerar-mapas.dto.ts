import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** Código do transporte (`transportes.numero_transporte`), não UUID. */
export const TransporteCodigoSchema = z.string().min(1).max(100);

const TipoDadosBasicosMapaSchema = z.enum(['transporte', 'cliente']);
const TipoQuebraPaleteSchema = z.enum(['percentual', 'linhas']);
const AgrupamentoMapaSchema = z.enum(['segregar_clientes', 'grupos_customizados']);
const TipoItemGrupoMapaSchema = z.enum(['transporte', 'cliente', 'remessa']);

export const OpcoesConferenciaSchema = z.object({
  classificarPor: z.enum(['pickway', 'sku']),
  agrupamento: z.enum(['replicar_separacao', 'apenas_transporte']),
});

export const GerarMapasConfigSchema = z.object({
  tipoDadosBasicos: TipoDadosBasicosMapaSchema,
  quebraPalete: z.object({
    ativo: z.boolean(),
    tipo: TipoQuebraPaleteSchema,
    valor: z.number().min(0),
  }),
  exibirClienteCabecalho: z.boolean(),
  segregarPaleteFull: z.boolean().default(false),
  segregarUnidade: z.boolean().default(false),
  agrupamento: z.object({
    tiposAtivos: z.array(AgrupamentoMapaSchema),
    clientesSegregados: z.array(z.string()),
    grupos: z.array(
      z.object({
        id: z.string(),
        nome: z.string(),
        tipoItem: TipoItemGrupoMapaSchema,
        itens: z.array(z.string()),
      }),
    ),
  }),
  opcoesConferencia: OpcoesConferenciaSchema.default({
    classificarPor: 'sku',
    agrupamento: 'replicar_separacao',
  }),
});

export const GerarMapasBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  transporteIds: z.array(TransporteCodigoSchema).min(1),
  config: GerarMapasConfigSchema,
});

export class GerarMapasBodyDto extends createZodDto(GerarMapasBodySchema) {}

export const BreakdownQuantidadeSchema = z
  .object({
    paletes: z.number().int(),
    caixas: z.number().int(),
    unidades: z.number().int(),
    pesoPaletes: z.number().nullable(),
    pesoCaixas: z.number().nullable(),
    pesoUnidades: z.number().nullable(),
  })
  .nullable();

export const ItemGrupoMapaSchema = z.object({
  sku: z.string(),
  descricao: z.string().nullable(),
  remessa: z.string(),
  cliente: z.string(),
  codCliente: z.string(),
  empresa: z.string(),
  categoria: z.string(),
  lote: z.string().nullable(),
  dataFabricacao: z.string().nullable(),
  faixa: z.string().nullable(),
  quantidade: z.number(),
  unidadeMedida: z.string(),
  quantidadeNormalizadaUnidades: z.number(),
  peso: z.number().nullable(),
  endereco: z.string().nullable().optional(),
  quebraPalete: z.boolean().optional(),
  breakdown: BreakdownQuantidadeSchema,
});

export const CabecalhoGrupoMapaSchema = z.object({
  transporte: z.string(),
  placa: z.string().nullable(),
  transportadora: z.string().nullable(),
  codPrimeiroCliente: z.string(),
  primeiroCliente: z.string(),
  codTodosClientes: z.string(),
  todosClientes: z.string(),
  pesoTotal: z.number(),
  totalCaixas: z.number().int(),
  totalUnidades: z.number().int(),
  totalPaletes: z.number().int(),
  nomeGrupo: z.string(),
  quantidadeLinhas: z.number().int(),
  categoria: z.string(),
  empresa: z.string(),
  microUuid: z.string(),
});

export const GrupoMapaSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  subtitulo: z.string().optional(),
  infoAdicionaisI: z.string().optional(),
  infoAdicionaisII: z.string().optional(),
  totalItens: z.number(),
  pesoTotal: z.number(),
  
  tempoEsperado: z.number().int().min(0).default(0),
  cabecalho: CabecalhoGrupoMapaSchema,
  itens: z.array(ItemGrupoMapaSchema),
});

export const MapaEtapaPayloadSchema = z.object({
  agrupamento: z.string(),
  tipoDadosBasicos: TipoDadosBasicosMapaSchema,
  totalGrupos: z.number(),
  grupos: z.array(GrupoMapaSchema),
});

export const LinhaTabelaEmpresaCarregamentoSchema = z.object({
  empresa: z.string(),
  categoria: z.string(),
  quantidadeUnidade: z.number().int(),
  quantidadeCaixa: z.number().int(),
  quantidadePalete: z.number().int(),
  pesoKg: z.number(),
});

export const LinhaTabelaClienteCarregamentoSchema = z.object({
  codCliente: z.string(),
  cliente: z.string(),
  cidade: z.string(),
  pesoKg: z.number(),
  volumeM3: z.number(),
  quantidadeUnidade: z.number().int(),
  quantidadeCaixa: z.number().int(),
  quantidadePalete: z.number().int(),
});

export const TotaisMinutaCarregamentoSchema = z.object({
  pesoKg: z.number(),
  volumeM3: z.number(),
  quantidadeUnidade: z.number().int(),
  quantidadeCaixa: z.number().int(),
  quantidadePalete: z.number().int(),
});

export const MinutaCarregamentoSchema = z.object({
  transporteId: TransporteCodigoSchema,
  cabecalho: CabecalhoGrupoMapaSchema,
  tabelaEmpresa: z.array(LinhaTabelaEmpresaCarregamentoSchema),
  tabelaClientes: z.array(LinhaTabelaClienteCarregamentoSchema),
  totais: TotaisMinutaCarregamentoSchema,
});

export const CarregamentoPayloadSchema = z.object({
  totalMinutas: z.number().int(),
  minutas: z.array(MinutaCarregamentoSchema),
});

export const GerarMapasResponseSchema = MapaEtapaPayloadSchema.extend({
  separacao: MapaEtapaPayloadSchema,
  conferencia: MapaEtapaPayloadSchema,
  opcoesConferencia: OpcoesConferenciaSchema,
  carregamento: CarregamentoPayloadSchema,
});

export class GerarMapasResponseDto extends createZodDto(GerarMapasResponseSchema) {}

export type GerarMapasConfigInput = z.infer<typeof GerarMapasConfigSchema>;
export type GerarMapasBodyInput = z.infer<typeof GerarMapasBodySchema>;
export type OpcoesConferenciaInput = z.infer<typeof OpcoesConferenciaSchema>;
export type MapaEtapaPayload = z.infer<typeof MapaEtapaPayloadSchema>;
export type CarregamentoPayload = z.infer<typeof CarregamentoPayloadSchema>;
export type MinutaCarregamento = z.infer<typeof MinutaCarregamentoSchema>;
export type GerarMapasResponse = z.infer<typeof GerarMapasResponseSchema>;

export function emptyCarregamentoPayload(): CarregamentoPayload {
  return {
    totalMinutas: 0,
    minutas: [],
  };
}

export function montarGerarMapasResponse(
  separacao: MapaEtapaPayload,
  conferencia: MapaEtapaPayload,
  opcoesConferencia: OpcoesConferenciaInput,
  carregamento: CarregamentoPayload,
): GerarMapasResponse {
  return {
    ...separacao,
    separacao,
    conferencia,
    opcoesConferencia,
    carregamento,
  };
}
