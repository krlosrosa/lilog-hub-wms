'use client';

type ProdutoStatsCardsProps = {
  totalSkus: number;
  categoriasAtivas: number;
  aguardandoEan: number;
  compact?: boolean;
};

export function ProdutoStatsCards({
  totalSkus,
  categoriasAtivas,
  aguardandoEan,
}: ProdutoStatsCardsProps) {
  const formatNumber = new Intl.NumberFormat('pt-BR');

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-outline-variant/60 bg-surface-low/40 px-3 py-2 text-xs">
      <Metric label="SKUs" value={formatNumber.format(totalSkus)} />
      <Divider />
      <Metric label="Categorias" value={String(categoriasAtivas)} />
      <Divider />
      <Metric
        label="Sem EAN"
        value={formatNumber.format(aguardandoEan)}
        highlight={aguardandoEan > 0}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={
          highlight
            ? 'text-sm font-semibold tabular-nums text-destructive'
            : 'text-sm font-semibold tabular-nums text-foreground'
        }
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <span
      className="hidden h-4 w-px bg-outline-variant sm:block"
      aria-hidden
    />
  );
}
