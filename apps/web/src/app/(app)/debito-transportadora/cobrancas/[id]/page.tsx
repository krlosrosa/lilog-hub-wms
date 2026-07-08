import { DocumentoDetalheView } from '@/features/debito-transportadora/views/documento-detalhe-view';

export default async function DocumentoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <DocumentoDetalheView documentoId={id} />;
}
