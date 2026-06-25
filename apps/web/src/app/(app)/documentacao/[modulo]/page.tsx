import { notFound } from 'next/navigation';

import { DocumentacaoModuloView } from '@/features/documentacao';
import { getDocModulo } from '@/features/documentacao/content';

export default function DocumentacaoModuloPage({
  params,
}: {
  params: { modulo: string };
}) {
  const modulo = getDocModulo(params.modulo);

  if (!modulo) {
    notFound();
  }

  return <DocumentacaoModuloView modulo={modulo} />;
}
