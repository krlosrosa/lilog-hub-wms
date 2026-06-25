import { cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  Boxes,
  ChevronRight,
  PackagePlus,
  RotateCcw,
  Search,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';

import { hapticLight, hapticMedium } from '@/lib/haptics';

interface SubModuleItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  iconTone: 'secondary' | 'primary' | 'warning';
}

const SUB_MODULES: SubModuleItem[] = [
  {
    id: 'consulta-produto',
    title: 'Consulta de Produto',
    description: 'Busca SKU e localizações no armazém',
    icon: Search,
    to: '/estoque/consulta',
    iconTone: 'primary',
  },
  {
    id: 'inventario',
    title: 'Inventário',
    description: 'Contagem e ajuste de estoque',
    icon: Warehouse,
    to: '/estoque/contagem',
    iconTone: 'secondary',
  },
  {
    id: 'recuperacao',
    title: 'Recuperação de Avarias',
    description: 'Triagem e reprocessamento de itens avariados',
    icon: RotateCcw,
    to: '/estoque/recuperacao',
    iconTone: 'warning',
  },
  {
    id: 'armazenagem',
    title: 'Armazenagem',
    description: 'Guardar produtos nos endereços de picking',
    icon: PackagePlus,
    to: '/estoque/armazenagem',
    iconTone: 'secondary',
  },
];

const ICON_TONE_CLASS: Record<SubModuleItem['iconTone'], string> = {
  secondary: 'bg-secondary-container text-on-secondary-container',
  primary: 'bg-primary-container text-on-primary-container',
  warning: 'bg-warning-container text-on-warning-container',
};

function SubModuleCard({ module }: { module: SubModuleItem }) {
  const Icon = module.icon;

  return (
    <Link
      to={module.to}
      onClick={() => hapticMedium()}
      className="group flex items-center gap-4 rounded-lg border border-outline-variant bg-surface p-4 shadow-sm active:bg-surface-container transition-colors touch-manipulation"
      aria-label={`Abrir ${module.title}`}
    >
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
          ICON_TONE_CLASS[module.iconTone],
        )}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-body-md font-semibold text-on-surface">{module.title}</p>
        <p className="mt-0.5 line-clamp-1 text-body-sm text-on-surface-variant">
          {module.description}
        </p>
      </div>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-outline transition-transform group-active:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

export function EstoqueView() {
  return (
    <div className="page-enter flex flex-col pb-4">
      <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="flex h-14 items-center gap-3 px-margin-mobile">
          <Link
            to="/"
            aria-label="Voltar ao menu"
            onPointerDown={() => hapticLight()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
              Estoque
            </h1>
            <p className="truncate text-label-sm text-on-surface-variant">
              Contagem, ajuste e gestão de estoque
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container">
            <Boxes className="h-5 w-5 text-on-secondary-container" aria-hidden />
          </div>
        </div>
      </div>

      <section className="mt-4 space-y-3 px-margin-mobile" aria-label="Módulos de estoque">
        <h2 className="text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">
          Módulos
        </h2>
        {SUB_MODULES.map((module) => (
          <SubModuleCard key={module.id} module={module} />
        ))}
      </section>
    </div>
  );
}
