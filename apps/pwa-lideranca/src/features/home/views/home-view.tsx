import { LEADERSHIP_MODULES } from '../config/modules';
import { FeaturedModuleCard, ModuleCard } from '../components/module-cards';
import { WelcomeHero } from '../components/welcome-hero';

export function HomeView() {
  const featured = LEADERSHIP_MODULES.filter((m) => m.featured);
  const gridModules = LEADERSHIP_MODULES.filter((m) => !m.featured);

  return (
    <div className="page-enter flex flex-col pb-4">
      <div className="pt-4">
        <WelcomeHero />
      </div>

      <section className="mt-6 space-y-3 px-margin-mobile" aria-label="Módulos em destaque">
        <h2 className="text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">
          Em destaque
        </h2>
        {featured.map((module) => (
          <FeaturedModuleCard key={module.id} module={module} />
        ))}
      </section>

      <section
        className="mt-6 grid grid-cols-2 gap-3 px-margin-mobile"
        aria-label="Todos os módulos"
      >
        <h2 className="col-span-2 text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">
          Todos os módulos
        </h2>
        {gridModules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </section>
    </div>
  );
}
