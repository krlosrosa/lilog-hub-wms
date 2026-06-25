import { Suspense } from 'react';

import { RegrasPausasView } from '@/features/regras-pausas';

export default function RegrasPausasPage() {
  return (
    <Suspense fallback={null}>
      <RegrasPausasView />
    </Suspense>
  );
}
