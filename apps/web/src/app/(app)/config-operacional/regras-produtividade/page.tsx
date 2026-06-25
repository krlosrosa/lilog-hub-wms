import { Suspense } from 'react';

import { RegrasProdutividadeView } from '@/features/config-operacional';

export default function RegrasProdutividadePage() {
  return (
    <Suspense fallback={null}>
      <RegrasProdutividadeView />
    </Suspense>
  );
}
