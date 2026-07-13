import type { RecebimentoCadastroFormValues } from '@/features/recebimento/types/recebimento-cadastro.schema';
import type {
  CreatePreRecebimentoPayload,
  NotaFiscalPreRecebimentoPayload,
} from '@/features/recebimento/types/recebimento.api';

import type { RecebimentoXlsxDemanda } from '@/features/recebimento/lib/parse-recebimento-xlsx';

function parseOptionalPositiveNumber(value?: string): number | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function mapNotasFiscais(
  notas?: RecebimentoCadastroFormValues['notasFiscais'],
): NotaFiscalPreRecebimentoPayload[] | undefined {
  if (!notas?.length) {
    return undefined;
  }

  const mapped = notas
    .map((nota) => ({
      numeroNf: nota.numeroNf.trim(),
      serie: nota.serie?.trim() || undefined,
      chaveAcesso: nota.chaveAcesso?.trim() || undefined,
      numeroRemessa: nota.numeroRemessa?.trim() || undefined,
      fornecedorNome: nota.fornecedorNome?.trim() || undefined,
      fornecedorDocumento: nota.fornecedorDocumento?.trim() || undefined,
      pesoTotal: parseOptionalPositiveNumber(nota.pesoTotal),
      volumeTotal: parseOptionalPositiveNumber(nota.volumeTotal),
      observacao: nota.observacao?.trim() || undefined,
    }))
    .filter((nota) => nota.numeroNf.length > 0);

  return mapped.length > 0 ? mapped : undefined;
}

export function buildCreatePreRecebimentoPayloadFromDemanda(
  unidadeId: string,
  demanda: RecebimentoXlsxDemanda,
): CreatePreRecebimentoPayload {
  const { cabecalho } = demanda;

  if (!cabecalho.horarioPrevisto) {
    throw new Error(
      `OCR ${cabecalho.numeroOcr ?? '—'}: informe a data agendada (previsão de chegada)`,
    );
  }

  return {
    unidadeId,
    transportadoraNome: cabecalho.transportadoraNome?.trim() || undefined,
    placa: cabecalho.placa?.trim().toUpperCase() || undefined,
    numeroOcr: cabecalho.numeroOcr?.trim() || undefined,
    numeroTransporte: cabecalho.numeroTransporte?.trim() || undefined,
    origemDados: 'xlsx',
    origem: cabecalho.centroOrigem?.trim() || '3201',
    horarioPrevisto: new Date(cabecalho.horarioPrevisto).toISOString(),
    notasFiscais: mapNotasFiscais(demanda.notasFiscais),
    itens: demanda.itens.map((item) => ({
      produtoId: item.produtoId,
      quantidadeEsperada: item.quantidadeEsperada,
      unidadeMedida: item.unidadeMedida,
      loteEsperado: item.loteEsperado?.trim() || undefined,
      pesoEsperado: parseOptionalPositiveNumber(item.pesoEsperado),
      validadeEsperada: item.validadeEsperada
        ? new Date(item.validadeEsperada).toISOString()
        : undefined,
    })),
  };
}

export function buildCreatePreRecebimentoPayloadFromForm(
  unidadeId: string,
  data: RecebimentoCadastroFormValues,
): CreatePreRecebimentoPayload {
  const placa = data.placa?.trim().toUpperCase();

  return {
    unidadeId,
    transportadoraNome: data.transportadoraNome?.trim() || undefined,
    placa: placa || undefined,
    numeroOcr: data.numeroOcr?.trim() || undefined,
    numeroTransporte: data.numeroTransporte?.trim() || undefined,
    origemDados: data.origemDados,
    horarioPrevisto: new Date(data.horarioPrevisto).toISOString(),
    observacao: data.observacao?.trim() || undefined,
    quantidadePaletesEsperada: data.quantidadePaletesEsperada,
    notasFiscais: mapNotasFiscais(data.notasFiscais),
    itens: data.itens.map((item) => ({
      produtoId: item.produtoId,
      quantidadeEsperada: item.quantidadeEsperada,
      unidadeMedida: item.unidadeMedida,
      loteEsperado: item.loteEsperado?.trim() || undefined,
      pesoEsperado: parseOptionalPositiveNumber(item.pesoEsperado),
      validadeEsperada: item.validadeEsperada
        ? new Date(item.validadeEsperada).toISOString()
        : undefined,
    })),
  };
}
