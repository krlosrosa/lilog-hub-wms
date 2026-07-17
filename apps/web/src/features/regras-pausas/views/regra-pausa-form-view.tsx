'use client';

import Link from 'next/link';

import { Button, cn } from '@lilog/ui';
import { ArrowLeft, Coffee, Loader2, Save } from 'lucide-react';
import { Controller, FormProvider } from 'react-hook-form';

import { SidebarMain } from '@/components/layout/sidebar';
import { CollapsiblePanelSection } from '@/components/ui/collapsible-panel-section';
import {
  fieldInputClassName,
  sectionLabelClassName,
} from '@/components/ui/panel-styles';
import { SwitchToggle } from '@/components/ui/switch-toggle';
import { useRegraPausaForm } from '@/features/regras-pausas/hooks/use-regra-pausa-form';
import { formatIntervaloTrabalho } from '@/features/regras-pausas/lib/calcular-alerta-pausa';
import { regrasPausasListaPath } from '@/features/regras-pausas/lib/regras-pausas-paths';
import {
  TIPOS_PAUSA_REGRA,
  TIPO_PAUSA_REGRA_LABELS,
} from '@/features/regras-pausas/types/tipo-pausa-regra-tabs';

type RegraPausaFormViewProps = {
  regraId?: string;
};

export function RegraPausaFormView({ regraId }: RegraPausaFormViewProps) {
  const {
    form,
    isEditing,
    isLoading,
    isSubmitting,
    notFound,
    onSubmit,
    cancelar,
  } = useRegraPausaForm({ regraId });

  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;

  const watched = watch();
  const tipoLabel = TIPO_PAUSA_REGRA_LABELS[watched.tipo];

  if (isLoading) {
    return (
      <SidebarMain>
        <main className="flex min-h-dvh items-center justify-center px-margin-mobile py-12 md:px-margin-desktop">
          <div className="text-center">
            <Loader2
              className="mx-auto size-8 animate-spin text-muted-foreground"
              aria-hidden
            />
            <p className="mt-3 text-sm text-muted-foreground">Carregando regra…</p>
          </div>
        </main>
      </SidebarMain>
    );
  }

  if (notFound) {
    return (
      <SidebarMain>
        <main className="flex min-h-dvh items-center justify-center px-margin-mobile py-12 md:px-margin-desktop">
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Regra não encontrada</p>
            <Button asChild variant="link" className="mt-2">
              <Link href={regrasPausasListaPath()}>Voltar à lista</Link>
            </Button>
          </div>
        </main>
      </SidebarMain>
    );
  }

  const previewText =
    watched.intervaloTrabalhoMinutos > 0
      ? `Após ${formatIntervaloTrabalho(watched.intervaloTrabalhoMinutos)} de trabalho contínuo, orientar pausa ${tipoLabel.toLowerCase()} de ${watched.duracaoPausaMinutos} min.`
      : `Controla apenas a duração da pausa ${tipoLabel.toLowerCase()} (${watched.duracaoPausaMinutos} min), sem alerta automático de intervalo.`;

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 gap-1.5 text-muted-foreground"
              asChild
            >
              <Link href={regrasPausasListaPath(watched.tipo)}>
                <ArrowLeft className="size-4" aria-hidden />
                Voltar
              </Link>
            </Button>

            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                <Coffee className="size-5" aria-hidden />
              </span>
              <span className="text-caption font-bold uppercase tracking-widest text-primary">
                Configurações · Pausas
              </span>
            </div>
            <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
              {isEditing ? 'Editar regra de pausa' : 'Nova regra de pausa'}
            </h1>
          </div>

          <FormProvider {...form}>
            <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <CollapsiblePanelSection title="Identificação" defaultExpanded>
                  <div className="space-y-4 p-4">
                    <div>
                      <label className={sectionLabelClassName} htmlFor="nome">
                        Nome do perfil
                      </label>
                      <input
                        id="nome"
                        className={cn(fieldInputClassName, errors.nome && 'border-destructive')}
                        {...register('nome')}
                      />
                      {errors.nome && (
                        <p className="mt-1 text-xs text-destructive">{errors.nome.message}</p>
                      )}
                    </div>

                    <div>
                      <label className={sectionLabelClassName} htmlFor="descricao">
                        Descrição
                      </label>
                      <textarea
                        id="descricao"
                        rows={2}
                        className={fieldInputClassName}
                        {...register('descricao')}
                      />
                    </div>

                    {!isEditing && (
                      <div>
                        <label className={sectionLabelClassName} htmlFor="tipo">
                          Tipo de pausa
                        </label>
                        <select
                          id="tipo"
                          className={fieldInputClassName}
                          {...register('tipo')}
                        >
                          {TIPOS_PAUSA_REGRA.map(({ id, label }) => (
                            <option key={id} value={id}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-6">
                      <Controller
                        name="ativo"
                        control={control}
                        render={({ field }) => (
                          <div className="flex items-center justify-between gap-3 rounded-md border border-outline-variant/60 bg-surface-low/20 px-2.5 py-2">
                            <span className="text-xs font-medium text-foreground">
                              Regra ativa
                            </span>
                            <SwitchToggle
                              checked={field.value}
                              onChange={() => field.onChange(!field.value)}
                              label="Regra ativa"
                            />
                          </div>
                        )}
                      />
                      <Controller
                        name="padrao"
                        control={control}
                        render={({ field }) => (
                          <div className="flex items-center justify-between gap-3 rounded-md border border-outline-variant/60 bg-surface-low/20 px-2.5 py-2">
                            <span className="text-xs font-medium text-foreground">
                              Perfil padrão
                            </span>
                            <SwitchToggle
                              checked={field.value}
                              onChange={() => field.onChange(!field.value)}
                              label="Perfil padrão"
                            />
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </CollapsiblePanelSection>

                <CollapsiblePanelSection title="Parâmetros de pausa" defaultExpanded>
                  <div className="space-y-4 p-4">
                    <div>
                      <label
                        className={sectionLabelClassName}
                        htmlFor="intervaloTrabalhoMinutos"
                      >
                        A cada quantos minutos de trabalho
                      </label>
                      <input
                        id="intervaloTrabalhoMinutos"
                        type="number"
                        min={0}
                        className={cn(
                          fieldInputClassName,
                          errors.intervaloTrabalhoMinutos && 'border-destructive',
                        )}
                        {...register('intervaloTrabalhoMinutos', { valueAsNumber: true })}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Conta desde o check-in ou desde o fim da última pausa. Use 0 para
                        desativar alertas automáticos.
                      </p>
                    </div>

                    <div>
                      <label
                        className={sectionLabelClassName}
                        htmlFor="duracaoPausaMinutos"
                      >
                        Duração da pausa (minutos)
                      </label>
                      <input
                        id="duracaoPausaMinutos"
                        type="number"
                        min={0}
                        className={cn(
                          fieldInputClassName,
                          errors.duracaoPausaMinutos && 'border-destructive',
                        )}
                        {...register('duracaoPausaMinutos', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                </CollapsiblePanelSection>
              </div>

              <aside className="space-y-4">
                <div className="rounded-xl border border-outline-variant bg-surface-low p-4">
                  <p className="text-caption font-medium text-foreground">Preview</p>
                  <p className="mt-2 text-sm text-muted-foreground">{previewText}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={isSubmitting} className="gap-1.5">
                    {isSubmitting ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Save className="size-4" aria-hidden />
                    )}
                    Salvar regra
                  </Button>
                  <Button type="button" variant="outline" onClick={cancelar}>
                    Cancelar
                  </Button>
                </div>
              </aside>
            </form>
          </FormProvider>
        </div>
      </main>
    </SidebarMain>
  );
}
