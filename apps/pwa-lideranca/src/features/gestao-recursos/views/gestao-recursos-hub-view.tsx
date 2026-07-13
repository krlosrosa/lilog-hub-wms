import { AreaHubCard } from '@/features/home/components/area-hub-card';
import { EXPEDICAO_PROCESSO_MODULES } from '@/features/home/config/operational-areas';
import { SessaoSubHeader } from '@/features/sessao-presenca/components/sessao-sub-header';

export function GestaoRecursosHubView() {
  return (
    <div className="page-enter flex flex-col pb-8">
      <SessaoSubHeader
        backTo="/expedicao"
        backLabel="Voltar à expedição"
        title="Gestão de Recursos"
        subtitle="Escolha o processo para monitorar"
      />

      <section
        className="space-y-3 px-margin-mobile py-3"
        aria-label="Processos da expedição"
      >
        {EXPEDICAO_PROCESSO_MODULES.map((item) => (
          <AreaHubCard key={item.id} item={item} layout="featured" />
        ))}
      </section>
    </div>
  );
}
