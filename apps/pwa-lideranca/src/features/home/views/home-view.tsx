import { LEADERSHIP_MODULES } from '../config/modules';
import { FeaturedModuleCard, ModuleCard } from '../components/module-cards';
import { WelcomeHero } from '../components/welcome-hero';

const SECTION_LABELS = {
  turno: 'Turno',
  operacional: 'Áreas operacionais',
  futuro: 'Em breve',
} as const;

export function HomeView() {
  const turnoModules = LEADERSHIP_MODULES.filter((m) => m.section === 'turno');
  const operacionalModules = LEADERSHIP_MODULES.filter(
    (m) => m.section === 'operacional',
  );
  const futuroModules = LEADERSHIP_MODULES.filter((m) => m.section === 'futuro');

  return (
    <div className="page-enter flex flex-col pb-4">
      <div className="pt-4">
        <WelcomeHero />
      </div>

      <section className="mt-6 space-y-3 px-margin-mobile" aria-label={SECTION_LABELS.turno}>
        <h2 className="text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">
          {SECTION_LABELS.turno}
        </h2>
        {turnoModules.map((module) => (
          <FeaturedModuleCard key={module.id} module={module} />
        ))}
      </section>

      <section
        className="mt-6 space-y-3 px-margin-mobile"
        aria-label={SECTION_LABELS.operacional}
      >
        <h2 className="text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">
          {SECTION_LABELS.operacional}
        </h2>
        {operacionalModules.map((module) => (
          <FeaturedModuleCard key={module.id} module={module} />
        ))}
      </section>

      {futuroModules.length > 0 ? (
        <section
          className="mt-6 grid grid-cols-2 gap-3 px-margin-mobile"
          aria-label={SECTION_LABELS.futuro}
        >
          <h2 className="col-span-2 text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">
            {SECTION_LABELS.futuro}
          </h2>
          {futuroModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
