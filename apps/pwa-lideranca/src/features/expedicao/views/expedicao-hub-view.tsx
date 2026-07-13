import { AreaHubCard } from '@/features/home/components/area-hub-card';
import { EXPEDICAO_AREA_MODULES } from '@/features/home/config/operational-areas';
import { SessaoSubHeader } from '@/features/sessao-presenca/components/sessao-sub-header';

export function ExpedicaoHubView() {
  return (
    <div className="page-enter flex flex-col pb-8">
      <SessaoSubHeader
        backTo="/"
        backLabel="Voltar ao menu"
        title="Expedição"
        subtitle="Torre de controle e gestão da equipe"
      />

      <section
        className="space-y-3 px-margin-mobile py-3"
        aria-label="Módulos da expedição"
      >
        {EXPEDICAO_AREA_MODULES.map((item) => (
          <AreaHubCard key={item.id} item={item} layout="featured" />
        ))}
      </section>
    </div>
  );
}
