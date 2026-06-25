'use client';

import dynamic from 'next/dynamic';

const AlocacaoPlacaView = dynamic(
  () => import('@/features/transporte').then((mod) => mod.AlocacaoPlacaView),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="text-sm text-muted-foreground">
          Carregando alocação de placa...
        </span>
      </div>
    ),
    ssr: false,
  },
);

export default function TransportePage() {
  return <AlocacaoPlacaView />;
}
