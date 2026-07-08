'use client';

import dynamic from 'next/dynamic';

const ArmazemLayoutBuilderScreen = dynamic(
  () =>
    import('@/features/armazem-layout').then((mod) => mod.ArmazemLayoutBuilderScreen),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="text-sm text-muted-foreground">Carregando mapa do armazém...</span>
      </div>
    ),
    ssr: false,
  },
);

export default function ArmazemMapaPage() {
  return <ArmazemLayoutBuilderScreen />;
}
