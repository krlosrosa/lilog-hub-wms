'use client';

import dynamic from 'next/dynamic';

const EstoqueMapaOcupacaoScreen = dynamic(
  () =>
    import('@/features/estoque-mapa-ocupacao').then(
      (mod) => mod.EstoqueMapaOcupacaoScreen,
    ),
  {
    loading: () => (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="text-sm text-muted-foreground">
          Carregando estoque por posição...
        </span>
      </div>
    ),
    ssr: false,
  },
);

export default function EstoqueMapaOcupacaoPage() {
  return <EstoqueMapaOcupacaoScreen />;
}
