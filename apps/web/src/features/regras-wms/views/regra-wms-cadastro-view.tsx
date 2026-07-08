'use client';

import Link from 'next/link';

import { Button, cn } from '@lilog/ui';
import {
  ArrowLeft,
  ArrowLeftRight,
  ClipboardList,
  FileText,
  Loader2,
  Package,
  Save,
  ScrollText,
  Truck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Controller, FormProvider, useFormContext } from 'react-hook-form';

import { SidebarMain } from '@/components/layout/sidebar';

import { AcaoConfigurator } from '@/features/regras-wms/components/acao-configurator';
import { ConditionTreeBuilder } from '@/features/regras-wms/components/condition-tree-builder';
import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  sectionCardClassName,
} from '@/features/regras-wms/components/regra-wms-form-field-classes';
import { RegraWmsPreviewPanel } from '@/features/regras-wms/components/regra-wms-preview-panel';
import { RegraWmsSectionHeader } from '@/features/regras-wms/components/regra-wms-section-header';
import { useRegraWmsForm } from '@/features/regras-wms/hooks/use-regra-wms-form';
import {
  GATILHO_LABELS,
  GATILHOS_HABILITADOS,
  type GatilhoRegra,
} from '@/features/regras-wms/types/regra-wms.schema';
import type { RegraWmsV2Form } from '@/features/regras-wms/types/regra-wms-tree.schema';

const GATILHO_OPTIONS: {
  value: GatilhoRegra;
  label: string;
  icon: LucideIcon;
}[] = GATILHOS_HABILITADOS.map((value) => ({
  value,
  label: GATILHO_LABELS[value],
  icon:
    value === 'recebimento'
      ? Truck
      : value === 'movimentacao'
        ? ArrowLeftRight
        : value === 'saida'
          ? Package
          : ClipboardList,
}));

function SecaoIdentificacao() {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<RegraWmsV2Form>();

  const prioridade = watch('prioridade');
  const prioridadeLabel =
    prioridade >= 80 ? 'Crítica' : prioridade >= 50 ? 'Alta' : 'Normal';

  return (
    <section className={sectionCardClassName}>
      <RegraWmsSectionHeader step={1} icon={FileText} title="Identificação" />

      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            <label htmlFor="nome" className={cn(fieldLabelClassName, 'mb-0.5')}>
              Nome
            </label>
            <input
              id="nome"
              {...register('nome')}
              placeholder="Ex.: Quarentena por validade curta"
              autoComplete="off"
              className={fieldInputClassName}
            />
            {errors.nome && (
              <p role="alert" className={fieldErrorClassName}>
                {errors.nome.message}
              </p>
            )}
          </div>

          <div className="shrink-0 sm:pt-[18px]">
            <Controller
              name="ativo"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  aria-label={field.value ? 'Regra ativa' : 'Regra inativa'}
                  onClick={() => field.onChange(!field.value)}
                  className={cn(
                    'inline-flex h-8 items-center gap-2 rounded-md border px-2.5 transition-all',
                    field.value
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-outline-variant bg-surface-low/40 text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors',
                      field.value ? 'bg-primary' : 'bg-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block size-3 rounded-full bg-background shadow-sm transition-transform',
                        field.value ? 'translate-x-3.5' : 'translate-x-0.5',
                      )}
                    />
                  </span>
                  <span className="text-[10px] font-semibold">
                    {field.value ? 'Ativa' : 'Inativa'}
                  </span>
                </button>
              )}
            />
          </div>
        </div>

        <div>
          <label htmlFor="descricao" className={cn(fieldLabelClassName, 'mb-0.5')}>
            Descrição
          </label>
          <input
            id="descricao"
            {...register('descricao')}
            placeholder="Objetivo da regra (opcional)"
            className={fieldInputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          <span className={cn(fieldLabelClassName, 'shrink-0 sm:mb-0')}>
            Gatilho
          </span>
          <Controller
            name="gatilho"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-1">
                {GATILHO_OPTIONS.map(({ value, label, icon: Icon }) => {
                  const selected = field.value === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => field.onChange(value)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-all',
                        selected
                          ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/20'
                          : 'border-outline-variant bg-surface-low/40 text-muted-foreground hover:border-primary/30',
                      )}
                    >
                      <Icon className="size-3" aria-hidden />
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          />
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="prioridade" className={cn(fieldLabelClassName, 'shrink-0')}>
            Prioridade
          </label>
          <input
            id="prioridade"
            type="range"
            min={1}
            max={100}
            {...register('prioridade', { valueAsNumber: true })}
            className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-surface-highest accent-primary"
          />
          <span
            className={cn(
              'shrink-0 rounded px-1.5 py-px text-[10px] font-semibold tabular-nums',
              prioridade >= 80
                ? 'bg-destructive/10 text-destructive'
                : prioridade >= 50
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {prioridade} {prioridadeLabel}
          </span>
        </div>
        {errors.prioridade && (
          <p role="alert" className={fieldErrorClassName}>
            {errors.prioridade.message}
          </p>
        )}
      </div>
    </section>
  );
}

export function RegraWmsCadastroView({ regraId }: { regraId?: string }) {
  const {
    form,
    isLoading,
    isSubmitting,
    isEditing,
    notFound,
    onSubmit,
    cancelar,
  } = useRegraWmsForm({ regraId });

  const nomeAtual = form.watch('nome');

  if (isLoading) {
    return (
      <SidebarMain>
        <main className="flex flex-1 items-center justify-center px-margin-mobile py-8 md:px-margin-desktop">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </main>
      </SidebarMain>
    );
  }

  if (notFound) {
    return (
      <SidebarMain>
        <main className="flex-1 px-margin-mobile py-8 md:px-margin-desktop">
          <div className="mx-auto max-w-container text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-surface-highest text-muted-foreground">
              <ScrollText className="size-7" aria-hidden />
            </div>
            <h1 className="text-headline-md font-semibold text-foreground">
              Regra não encontrada
            </h1>
            <p className="mt-2 text-body-md text-muted-foreground">
              A regra solicitada não existe ou foi removida.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/regras-wms">Voltar para lista</Link>
            </Button>
          </div>
        </main>
      </SidebarMain>
    );
  }

  return (
    <SidebarMain>
      <main className="flex-1 px-margin-mobile py-4 md:px-margin-desktop md:pb-8">
        <div className="mx-auto flex max-w-container flex-col gap-3">
          <nav
            aria-label="Migalhas"
            className="flex flex-wrap items-center gap-1.5 text-caption"
          >
            <Link
              href="/regras-wms"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Regras WMS
            </Link>
            <span aria-hidden className="text-muted-foreground">
              /
            </span>
            <span className="font-semibold text-foreground">
              {isEditing ? 'Editar regra' : 'Nova regra'}
            </span>
          </nav>

          <header className="sticky top-0 z-20 -mx-margin-mobile border-b border-outline-variant bg-glass-bg px-margin-mobile py-2.5 backdrop-blur-glass md:-mx-margin-desktop md:px-margin-desktop">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  asChild
                >
                  <Link href="/regras-wms" aria-label="Voltar">
                    <ArrowLeft className="size-4" />
                  </Link>
                </Button>
                <div className="min-w-0">
                  <h1 className="truncate text-body-md font-semibold text-foreground">
                    {nomeAtual || (isEditing ? 'Editar regra WMS' : 'Nova regra WMS')}
                  </h1>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={cancelar}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  form="regra-wms-form"
                  size="sm"
                  className="gap-1.5"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Save className="size-4" aria-hidden />
                  )}
                  {isEditing ? 'Salvar alterações' : 'Criar regra'}
                </Button>
              </div>
            </div>
          </header>

          <FormProvider {...form}>
            <form
              id="regra-wms-form"
              onSubmit={onSubmit}
              className="grid grid-cols-12 gap-3"
              noValidate
            >
              <div className="col-span-12 flex flex-col gap-3 xl:col-span-8">
                <SecaoIdentificacao />
                <ConditionTreeBuilder />
                <AcaoConfigurator />

                <p className="text-center text-[10px] text-muted-foreground">
                  Regras com maior prioridade são avaliadas primeiro.
                </p>
              </div>

              <RegraWmsPreviewPanel />
            </form>
          </FormProvider>
        </div>
      </main>
    </SidebarMain>
  );
}
