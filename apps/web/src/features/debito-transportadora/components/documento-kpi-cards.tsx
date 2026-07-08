'use client';

import { cn } from '@lilog/ui';

type DocumentoKpiCardsProps = {
  kpi: {
    totalEmAberto: number;
    quantidadeEmAberto: number;
    totalRecuperado: number;
    quantidadePagos: number;
    totalDocumentos: number;
  };
  isLoading?: boolean;
};

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

export function DocumentoKpiCards({ kpi, isLoading }: DocumentoKpiCardsProps) {
  const cards = [
    {
      label: 'Em Aberto',
      value: formatCurrency(kpi.totalEmAberto),
      hint: `${kpi.quantidadeEmAberto} documento(s)`,
    },
    {
      label: 'Recuperado',
      value: formatCurrency(kpi.totalRecuperado),
      hint: `${kpi.quantidadePagos} pago(s)`,
    },
    {
      label: 'Total de Documentos',
      value: String(kpi.totalDocumentos),
      hint: 'Gerados no período',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-xl border border-outline-variant/50 bg-glass-bg p-4 shadow-inner-glow backdrop-blur-glass"
        >
          <p className="text-caption text-muted-foreground">{card.label}</p>
          <p
            className={cn(
              'mt-1 text-xl font-semibold tabular-nums text-foreground',
              isLoading && 'animate-pulse text-muted-foreground',
            )}
          >
            {isLoading ? '—' : card.value}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">{card.hint}</p>
        </article>
      ))}
    </div>
  );
}
