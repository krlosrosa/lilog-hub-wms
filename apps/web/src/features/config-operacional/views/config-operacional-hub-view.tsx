'use client';

import { Settings2, Timer, Truck, Warehouse, Coffee, PackageX } from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import { ConfigSectionCard } from '@/features/config-operacional/components/config-section-card';

const SECTIONS = [
  {
    title: 'Regras de Produtividade',
    description:
      'Metas de tempo para separação, conferência e carregamento — deslocamento, caixas, paletes e gordura de mapa.',
    icon: Timer,
    href: '/config-operacional/regras-produtividade',
  },
  {
    title: 'Regras de Pausa',
    description:
      'Intervalos de trabalho contínuo e duração das pausas térmicas, refeição e outros por CD.',
    icon: Coffee,
    href: '/config-operacional/regras-pausas',
  },
  {
    title: 'Parâmetros de Conferência Devolução',
    description:
      'Modo de quantidade (caixa/unidade) e rastreabilidade (lote/fabricação) no PWA de devolução.',
    icon: PackageX,
    href: '/config-operacional/parametros-devolucao',
  },
  {
    title: 'Parâmetros de Conferência Recebimento',
    description:
      'Modo de quantidade (caixa/unidade), rastreabilidade (lote/fabricação) e checklist no PWA de recebimento.',
    icon: Truck,
    href: '/config-operacional/parametros-recebimento',
  },
  {
    title: 'Parâmetros WMS',
    description: 'Configurações gerais de movimentação e automações do armazém.',
    icon: Warehouse,
    comingSoon: true,
  },
] as const;

export function ConfigOperacionalHubView() {
  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <header className="mb-8">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                <Settings2 className="size-5" aria-hidden />
              </span>
              <span className="text-caption font-bold uppercase tracking-widest text-primary">
                Operacional
              </span>
            </div>
            <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
              Configurações do CD
            </h1>
            <p className="mt-1 max-w-2xl text-body-md text-muted-foreground">
              Centralize regras, parâmetros de produtividade e preferências operacionais
              do centro de distribuição.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map((section) => (
              <ConfigSectionCard
                key={section.title}
                title={section.title}
                description={section.description}
                icon={section.icon}
                href={'href' in section ? section.href : undefined}
                comingSoon={'comingSoon' in section ? section.comingSoon : false}
              />
            ))}
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
