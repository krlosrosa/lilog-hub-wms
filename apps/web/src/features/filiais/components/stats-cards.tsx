type StatsCardsProps = {
  total: number;
  totalCentros: number;
  porCluster: Record<string, number>;
};

export function StatsCards({
  total,
  totalCentros,
  porCluster,
}: StatsCardsProps) {
  const clustersAtivos = Object.keys(porCluster).length;

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
      <div className="rounded-xl border border-outline-variant bg-glass-bg p-5 backdrop-blur-glass shadow-inner-glow transition-colors hover:border-primary/30">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Total de Unidades
        </p>
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-bold text-foreground">{total}</h3>
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant bg-glass-bg p-5 backdrop-blur-glass shadow-inner-glow transition-colors hover:border-primary/30">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Centros Vinculados
        </p>
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-bold text-foreground">{totalCentros}</h3>
          <span className="text-[10px] font-medium text-muted-foreground">
            nesta página
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant bg-glass-bg p-5 backdrop-blur-glass shadow-inner-glow transition-colors hover:border-primary/30">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Clusters na Página
        </p>
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-bold text-foreground">{clustersAtivos}</h3>
          <span className="text-[10px] font-medium text-muted-foreground">
            tipos distintos
          </span>
        </div>
      </div>
    </div>
  );
}
