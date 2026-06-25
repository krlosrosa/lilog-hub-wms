'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import {
  RegrasProdutividadeFormRouter,
  parseEtapaProdutividade,
} from '@/features/config-operacional';

function NovaRegraProdutividadeContent() {
  const searchParams = useSearchParams();
  const tipo = parseEtapaProdutividade(searchParams.get('tipo'));
  return <RegrasProdutividadeFormRouter tipo={tipo} />;
}

export default function NovaRegraProdutividadePage() {
  return (
    <Suspense fallback={null}>
      <NovaRegraProdutividadeContent />
    </Suspense>
  );
}
