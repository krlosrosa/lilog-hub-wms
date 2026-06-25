'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Building2,
  ClipboardList,
  Package,
  Truck,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@lilog/ui';

import { accentSubtleNavActiveClassName } from '@/lib/semantic-badge-classes';

import { DOC_MODULOS } from '@/features/documentacao/content';
import type { DocModuloContent, DocSection, DocSectionId } from '@/features/documentacao/types';

const ICON_MAP: Record<DocModuloContent['icon'], LucideIcon> = {
  Building2,
  Package,
  Truck,
  ClipboardList,
};

type DocsNavProps = {
  modulo?: DocModuloContent;
  activeSection?: DocSectionId;
  onSectionClick?: (sectionId: DocSectionId) => void;
};

function sectionHref(moduloSlug: string, sectionId: DocSectionId) {
  return `/documentacao/${moduloSlug}#${sectionId}`;
}

export function DocsNav({ modulo, activeSection, onSectionClick }: DocsNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação da documentação" className="space-y-6">
      <div>
        <p className="mb-3 text-caption font-semibold uppercase tracking-wider text-muted-foreground">
          Módulos
        </p>
        <ul className="space-y-1">
          {DOC_MODULOS.map((item) => {
            const Icon = ICON_MAP[item.icon];
            const isActive = pathname === item.href;

            return (
              <li key={item.slug}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-label-md transition-colors',
                    isActive
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {modulo ? (
        <div>
          <p className="mb-3 text-caption font-semibold uppercase tracking-wider text-muted-foreground">
            Neste guia
          </p>
          <ul className="space-y-1">
            {modulo.sections.map((section) => (
              <li key={section.id}>
                <SectionLink
                  section={section}
                  moduloSlug={modulo.slug}
                  isActive={activeSection === section.id}
                  onSectionClick={onSectionClick}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </nav>
  );
}

type SectionLinkProps = {
  section: DocSection;
  moduloSlug: string;
  isActive: boolean;
  onSectionClick?: (sectionId: DocSectionId) => void;
};

function SectionLink({
  section,
  moduloSlug,
  isActive,
  onSectionClick,
}: SectionLinkProps) {
  const href = sectionHref(moduloSlug, section.id);

  return (
    <a
      href={href}
      onClick={() => onSectionClick?.(section.id)}
      className={cn(
        'block rounded-lg px-3 py-2 text-label-md transition-colors',
        isActive
          ? accentSubtleNavActiveClassName
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {section.label}
    </a>
  );
}
