import { Suspense } from 'react';

import { ImpressaoMapaSeparacaoView } from '@/features/transporte/views/impressao-mapa-separacao-view';

export default function ImpressaoMapaSeparacaoPage() {
  return (
    <Suspense fallback={null}>
      <ImpressaoMapaSeparacaoView />
    </Suspense>
  );
}
