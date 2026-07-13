import { Suspense } from 'react';

import { Loader2 } from 'lucide-react';

import { EnderecosMapaCdView } from '@/features/enderecos/views/enderecos-mapa-cd-view';

export default function EnderecosMapaCdPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          Carregando mapa...
        </div>
      }
    >
      <EnderecosMapaCdView />
    </Suspense>
  );
}
