import { notFound } from 'next/navigation';

import { DocumentacaoModuloView } from '@/features/documentacao';
import { getDocModulo } from '@/features/documentacao/content';

export default async function DocumentacaoModuloPage({
  params,
}: {
  params: Promise<{ modulo: string }>;
}) {
  const { modulo: moduloSlug } = await params;
  const modulo = getDocModulo(moduloSlug);

  if (!modulo) {
    notFound();
  }

  return <DocumentacaoModuloView modulo={modulo} />;
}
