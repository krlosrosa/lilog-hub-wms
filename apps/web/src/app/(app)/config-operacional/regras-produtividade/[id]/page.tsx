'use client';

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

import {
  RegrasProdutividadeFormRouter,
  parseEtapaProdutividade,
} from '@/features/config-operacional';

function EditarRegraProdutividadeContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const tipo = parseEtapaProdutividade(searchParams.get('tipo'));
  return <RegrasProdutividadeFormRouter regraId={params.id} tipo={tipo} />;
}

export default function EditarRegraProdutividadePage() {
  return (
    <Suspense fallback={null}>
      <EditarRegraProdutividadeContent />
    </Suspense>
  );
}
