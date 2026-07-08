import { DetalheTimeline } from '@/features/debito-transportadora/components/detalhe-timeline';
import type { DocumentoTimelineEvento } from '@/features/debito-transportadora/types/documento-cobranca.schema';

type DocumentoDetalheTimelineProps = {
  eventos: DocumentoTimelineEvento[];
};

export function DocumentoDetalheTimeline({
  eventos,
}: DocumentoDetalheTimelineProps) {
  return <DetalheTimeline eventos={eventos} />;
}
