'use client';

import type { ReactNode } from 'react';
import {
  ArrowRight,
  Box,
  Building2,
  ChevronRight,
  FileUp,
  HardDrive,
  LayoutTemplate,
  Loader2,
  ShieldCheck,
  Snowflake,
  Warehouse,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { glassPanelClassName } from '@/features/layout-cd/components/layout-cd-panel-classes';
import { useProjetoEstrutura } from '@/features/layout-cd/hooks/use-projeto-estrutura';

export function ProjetoEstruturaView() {
  const {
    isLoading,
    templates,
    startFromScratch,
    importCad,
    selectTemplate,
    openArmazem,
  } = useProjetoEstrutura();

  const handleImport = async () => {
    const result = await importCad();
    toast.info(result.message);
  };

  return (
    <SidebarMain className="relative flex min-h-dvh flex-col overflow-hidden blueprint-grid">
      <header className="z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-card px-8">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-primary">WMS Builder</span>
          <span className="rounded border border-outline-variant px-3 py-1 font-mono text-xs uppercase tracking-widest text-outline">
            V2.4
          </span>
        </div>
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/layout-cd/armazem"
            className="rounded px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
          >
            Meus Projetos
          </Link>
          <span className="rounded px-3 py-2 font-medium text-muted-foreground">
            Equipe
          </span>
          <span className="rounded px-3 py-2 font-medium text-muted-foreground">
            Arquivos
          </span>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Ajuda">
            ?
          </Button>
          <Button variant="ghost" size="icon" aria-label="Configurações">
            ⚙
          </Button>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center p-4">
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-3xl font-semibold text-primary md:text-4xl">
            Novo Projeto de Estrutura
          </h1>
          <p className="mx-auto max-w-lg text-muted-foreground">
            Inicie sua modelagem de armazém com precisão técnica e ferramentas de
            engenharia avançadas.
          </p>
        </div>

        <div className="grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-6">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void startFromScratch()}
            className={cn(
              glassPanelClassName,
              'group flex cursor-pointer flex-col justify-between p-8 transition-all duration-300 hover:border-primary md:col-span-3 lg:col-span-2',
            )}
          >
            <div>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded border border-primary-container/30 bg-primary-container/20">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <Box className="h-6 w-6 text-primary-container" />
                )}
              </div>
              <h3 className="mb-2 text-lg font-medium text-foreground">
                Começar do Zero
              </h3>
              <p className="text-sm text-muted-foreground">
                Tela em branco com ferramentas de desenho de precisão e grade de
                8px.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 font-mono text-xs uppercase tracking-tighter text-primary-container">
              <span>Configurar Canvas</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => void handleImport()}
            className={cn(
              glassPanelClassName,
              'group relative flex cursor-pointer flex-col justify-between overflow-hidden p-8 transition-all duration-300 hover:border-primary md:col-span-3 lg:col-span-2',
            )}
          >
            <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-30">
              <Building2 className="h-[120px] w-[120px] text-muted-foreground" />
            </div>
            <div>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded border border-secondary-container/50 bg-secondary-container/40">
                <FileUp className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-foreground">
                Importar CAD/PDF
              </h3>
              <p className="text-sm text-muted-foreground">
                Converta plantas existentes em modelos 3D editáveis
                automaticamente.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 font-mono text-xs uppercase tracking-tighter text-secondary">
              <span>Selecionar Arquivo</span>
              <FileUp className="h-4 w-4" />
            </div>
          </button>

          <div
            className={cn(
              glassPanelClassName,
              'flex flex-col border-primary/20 bg-surface-high/40 p-8 md:col-span-6 lg:col-span-2',
            )}
          >
            <div className="mb-6">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded border border-tertiary-container/30 bg-tertiary-container/20">
                <LayoutTemplate className="h-6 w-6 text-tertiary" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-foreground">
                Usar Template
              </h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Estruturas pré-configuradas baseadas em padrões industriais.
              </p>
            </div>
            <div className="space-y-3">
              {templates.map((tpl) => (
                <TemplateButton
                  key={tpl.id}
                  name={tpl.name}
                  areaLabel={tpl.areaLabel}
                  icon={
                    tpl.id === 'cold-storage' ? (
                      <Snowflake className="h-5 w-5" />
                    ) : tpl.id === 'distribution' ? (
                      <Warehouse className="h-5 w-5" />
                    ) : (
                      <Building2 className="h-5 w-5" />
                    )
                  }
                  disabled={isLoading}
                  onClick={() => void selectTemplate(tpl.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 font-mono text-xs text-outline">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary-container" />
            <span>SERVIDOR CONECTADO</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            <span>LATÊNCIA: 24ms</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>SESSÃO SEGURA</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="mt-8"
          onClick={openArmazem}
        >
          Ver layout do armazém
        </Button>
      </main>

      <div className="pointer-events-none fixed bottom-0 left-0 h-32 w-full overflow-hidden opacity-20">
        <div className="absolute bottom-4 left-8 flex gap-12 font-mono text-xs text-muted-foreground">
          <div>
            <p>X: 42.000mm</p>
            <p>Y: 86.400mm</p>
          </div>
          <div>
            <p>GRID: 8mm (MINOR)</p>
            <p>SNAP: TRUE</p>
          </div>
          <div>
            <p>PROJ: 2024_WMS_ALPHA</p>
            <p>LOC: SÃO PAULO, BR</p>
          </div>
        </div>
      </div>
    </SidebarMain>
  );
}

function TemplateButton({
  name,
  areaLabel,
  icon,
  disabled,
  onClick,
}: {
  name: string;
  areaLabel: string;
  icon: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-lg border border-outline-variant bg-card p-4 transition-all hover:border-primary active:scale-[0.98]"
    >
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground transition-colors group-hover:text-primary">
          {icon}
        </span>
        <div className="text-left">
          <div className="text-sm font-medium text-foreground">{name}</div>
          <div className="font-mono text-[10px] uppercase text-outline">
            {areaLabel}
          </div>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-outline" />
    </button>
  );
}
