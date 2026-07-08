import type {
  BuscarDocumentoCobrancaResponse,
  CobrancaEventoApi,
  DocumentoCobrancaListItemApi,
} from '@/features/debito-transportadora/lib/cobranca-transportadora-api';
import type {
  DocumentoCobrancaDetalhe,
  DocumentoCobrancaListItem,
  DocumentoTimelineEvento,
} from '@/features/debito-transportadora/types/documento-cobranca.schema';
import { DOCUMENTO_STATUS_LABELS } from '@/features/debito-transportadora/types/documento-cobranca.schema';

function formatarData(dataIso: string | null): string | null {
  if (!dataIso) {
    return null;
  }

  return new Date(dataIso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatarDataCurta(dataIso: string): string {
  return new Date(dataIso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function mapEventosParaTimeline(
  eventos: CobrancaEventoApi[],
): DocumentoTimelineEvento[] {
  const ordenados = [...eventos].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return ordenados.map((evento, index) => {
    const isLast = index === ordenados.length - 1;
    const statusLabel =
      DOCUMENTO_STATUS_LABELS[
        evento.statusNovo as keyof typeof DOCUMENTO_STATUS_LABELS
      ] ?? evento.statusNovo;

    return {
      id: evento.id,
      titulo: statusLabel,
      subtitulo: formatarDataCurta(evento.createdAt),
      descricao: evento.descricao ?? undefined,
      tipo: isLast ? 'ativo' : 'concluido',
    };
  });
}

export function mapDocumentoParaListItem(
  documento: DocumentoCobrancaListItemApi,
): DocumentoCobrancaListItem {
  return {
    id: documento.id,
    numeroDocumento: documento.numeroDocumento,
    transportadora: documento.transportadoraNome,
    transportadoraId: documento.transportadoraId,
    status: documento.status,
    valorTotal: documento.valorTotal,
    quantidadeProcessos: documento.quantidadeProcessos,
    quantidadeItens: documento.quantidadeItens,
    emitidoEm: formatarData(documento.emitidoEm),
    enviadoEm: formatarData(documento.enviadoEm),
    pagoEm: formatarData(documento.pagoEm),
    createdAt: formatarData(documento.createdAt) ?? documento.createdAt,
    updatedAt: formatarData(documento.updatedAt) ?? documento.updatedAt,
  };
}

export function mapDocumentoParaDetalhe(
  documento: BuscarDocumentoCobrancaResponse,
): DocumentoCobrancaDetalhe {
  const base = mapDocumentoParaListItem(documento);

  return {
    ...base,
    observacao: documento.observacao,
    itens: documento.itens.map((item) => ({
      id: item.id,
      processoDebitoId: item.processoDebitoId,
      processoDebitoItemId: item.processoDebitoItemId,
      valorDebito: item.valorDebito,
      demandaId: item.demandaId,
      codigoDemanda: item.codigoDemanda,
      sku: item.sku,
      tipo: item.tipo,
      createdAt: item.createdAt,
    })),
    timeline: mapEventosParaTimeline(documento.eventos),
  };
}

export function computeDocumentoKpi(documentos: DocumentoCobrancaListItem[]) {
  const emAberto = documentos.filter(
    (doc) => doc.status === 'rascunho' || doc.status === 'emitido' || doc.status === 'enviado',
  );

  const pagos = documentos.filter((doc) => doc.status === 'pago');

  return {
    totalEmAberto: emAberto.reduce((acc, doc) => acc + doc.valorTotal, 0),
    quantidadeEmAberto: emAberto.length,
    totalRecuperado: pagos.reduce((acc, doc) => acc + doc.valorTotal, 0),
    quantidadePagos: pagos.length,
    totalDocumentos: documentos.length,
  };
}

export function proximaAcaoDocumento(
  status: DocumentoCobrancaDetalhe['status'],
): 'emitir' | 'enviar' | 'marcarPago' | 'cancelar' | null {
  switch (status) {
    case 'rascunho':
      return 'emitir';
    case 'emitido':
      return 'enviar';
    case 'enviado':
      return 'marcarPago';
    default:
      return null;
  }
}

export function podeCancelarDocumento(
  status: DocumentoCobrancaDetalhe['status'],
): boolean {
  return status === 'rascunho' || status === 'emitido' || status === 'enviado';
}
