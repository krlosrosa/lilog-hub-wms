import { z } from 'zod';

import { RavexApiEnvelopeSchema } from './ravex.types.js';

const ravexNumber = z.coerce.number();

const ravexOptionalNumber = z.preprocess(
  (value) => (value === null || value === '' ? undefined : value),
  z.coerce.number().optional(),
);

const ravexOptionalString = z.preprocess(
  (value) => {
    if (value === null || value === undefined) {
      return null;
    }

    return String(value);
  },
  z.string().nullable().optional(),
);

export const RavexViagemVeiculoSchema = z.object({
  placa: ravexOptionalString,
});

export type RavexViagemVeiculo = z.infer<typeof RavexViagemVeiculoSchema>;

export const RavexViagemFaturadaSchema = z.object({
  id: ravexNumber,
  identificador: z.string().nullable().optional(),
  inicioDataHora: z.string().nullable().optional(),
  fimDataHora: z.string().nullable().optional(),
  veiculo: RavexViagemVeiculoSchema.nullable().optional(),
});

export type RavexViagemFaturada = z.infer<typeof RavexViagemFaturadaSchema>;

export const RavexViagemFaturadaEnvelopeSchema = RavexApiEnvelopeSchema(
  RavexViagemFaturadaSchema,
);

export const RavexAnomaliaMotivoSchema = z.object({
  id: ravexOptionalNumber,
  descricao: z.string().nullable().optional(),
  codigo: z.string().nullable().optional(),
  setor: z
    .object({
      id: ravexOptionalNumber,
      nome: z.string().nullable().optional(),
      area: z
        .object({
          id: ravexOptionalNumber,
          nome: z.string().nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
});

export const RavexAnomaliaItemSchema = z.object({
  codigo: ravexOptionalString,
  itemId: ravexOptionalNumber,
  quantidadeDevolvida: ravexOptionalNumber,
  pesoBrutoDevolvido: ravexOptionalNumber,
  pesoLiquidoDevolvido: ravexOptionalNumber,
  notaFiscalDevolucao: ravexOptionalString,
  serieNotaFiscalDevolucao: ravexOptionalString,
  motivo: RavexAnomaliaMotivoSchema.nullable().optional(),
});

export const RavexAnomaliaViagemSchema = z.object({
  anomaliaId: ravexNumber,
  tipoRetorno: ravexOptionalNumber,
  senhaControle: ravexOptionalString,
  notaFiscalId: ravexOptionalNumber,
  observacao: z.string().nullable().optional(),
  numeroNotaFiscal: ravexOptionalString,
  serieNotaFiscal: ravexOptionalString,
  devolucaoContabil: z.coerce.boolean().optional(),
  latitude: ravexOptionalNumber,
  longitude: ravexOptionalNumber,
  dataHoraOcorrencia: z.string().nullable().optional(),
  dataHoraAceite: z.string().nullable().optional(),
  dataEmissaoNFDevolucao: z.string().nullable().optional(),
  valorTotalNFDevolucao: ravexOptionalNumber,
  valorAdicionalNFDevolucao: ravexOptionalNumber,
  ocorrenciaExterna: z.string().nullable().optional(),
  observacaoAnomalia: z.string().nullable().optional(),
  usuario: z
    .object({
      id: ravexOptionalNumber,
      email: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  operador: z
    .object({
      id: ravexOptionalNumber,
      nome: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  motivo: RavexAnomaliaMotivoSchema.nullable().optional(),
  item: RavexAnomaliaItemSchema.nullable().optional(),
});

export type RavexAnomaliaViagem = z.infer<typeof RavexAnomaliaViagemSchema>;

export const RavexAnomaliaViagemListEnvelopeSchema = RavexApiEnvelopeSchema(
  z.array(RavexAnomaliaViagemSchema),
);

export const RavexNotaFiscalProdutoSchema = z.object({
  id: ravexOptionalNumber,
  codigo: ravexOptionalString,
  descricao: z.string().nullable().optional(),
  unidade: z.string().nullable().optional(),
});

export const RavexNotaFiscalItemSchema = z.object({
  id: ravexNumber,
  sequencia: ravexOptionalNumber,
  referenciaItem: ravexOptionalString,
  descricaoItem: z.string().nullable().optional(),
  unidade: z.string().nullable().optional(),
  valorUnitario: ravexOptionalNumber,
  quantidade: ravexOptionalNumber,
  pesoBruto: ravexOptionalNumber,
  pesoLiquido: ravexOptionalNumber,
  validoAte: z.string().nullable().optional(),
  dataFabricacao: z.string().nullable().optional(),
  produto: RavexNotaFiscalProdutoSchema.nullable().optional(),
});

export type RavexNotaFiscalItem = z.infer<typeof RavexNotaFiscalItemSchema>;

export const RavexNotaFiscalItemListEnvelopeSchema = RavexApiEnvelopeSchema(
  z.array(RavexNotaFiscalItemSchema),
);

export const RavexEntregaDestinatarioSchema = z.object({
  id: ravexNumber,
  codigo: ravexOptionalString,
  nome: z.string().nullable().optional(),
  municipio: z.string().nullable().optional(),
  uf: z.string().nullable().optional(),
});

export type RavexEntregaDestinatario = z.infer<
  typeof RavexEntregaDestinatarioSchema
>;

export const RavexEntregaNotaFiscalSchema = z.object({
  id: ravexNumber,
  numero: ravexOptionalString,
  serie: ravexOptionalString,
  numeroPedido: ravexOptionalString,
  idPedido: ravexOptionalNumber,
});

export const RavexEntregaSchema = z.object({
  id: ravexNumber,
  destinatario: RavexEntregaDestinatarioSchema.nullable().optional(),
  notasFiscais: z.array(RavexEntregaNotaFiscalSchema).optional(),
});

export type RavexEntrega = z.infer<typeof RavexEntregaSchema>;

export const RavexEntregaListEnvelopeSchema = RavexApiEnvelopeSchema(
  z.array(RavexEntregaSchema),
);
