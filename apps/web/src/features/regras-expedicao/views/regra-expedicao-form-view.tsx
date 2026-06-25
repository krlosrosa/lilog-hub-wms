'use client';

import Link from 'next/link';

import { Button, cn } from '@lilog/ui';
import {
  ArrowLeft,
  Clock,
  FileText,
  Loader2,
  Save,
  Timer,
} from 'lucide-react';
import { Controller, FormProvider } from 'react-hook-form';

import { SidebarMain } from '@/components/layout/sidebar';
import { CollapsiblePanelSection } from '@/features/expedicao-impressao-config/components/collapsible-panel-section';
import {
  fieldInputClassName,
  sectionLabelClassName,
} from '@/features/expedicao-impressao-config/components/panel-styles';
import { SwitchToggle } from '@/features/expedicao-config-mapa/components/switch-toggle';
import { ParametrosTempoPanel } from '@/features/regras-expedicao/components/parametros-tempo-panel';
import { TempoEsperadoPreview } from '@/features/regras-expedicao/components/tempo-esperado-preview';
import { regrasProdutividadeListaPath } from '@/features/config-operacional/lib/regras-produtividade-paths';
import { useRegraExpedicaoForm } from '@/features/regras-expedicao/hooks/use-regra-expedicao-form';

type RegraExpedicaoFormViewProps = {
  regraId?: string;
};

export function RegraExpedicaoFormView({ regraId }: RegraExpedicaoFormViewProps) {
  const {
    form,
    isEditing,
    isLoading,
    isSubmitting,
    notFound,
    onSubmit,
    cancelar,
    simQtdItens,
    setSimQtdItens,
    simQtdEnderecos,
    setSimQtdEnderecos,
    simQtdItensSemEndereco,
    setSimQtdItensSemEndereco,
  } = useRegraExpedicaoForm({ regraId });

  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;

  const watchedValues = watch();

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
              <Link href={regrasProdutividadeListaPath('separacao')}>Voltar à lista</Link>
            </Button>
          </div>
        </main>
      </SidebarMain>
    );
  }

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
              <Link href={regrasProdutividadeListaPath('separacao')}>
                <ArrowLeft className="size-4" aria-hidden />
                Voltar
              </Link>
            </Button>

            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                <Timer className="size-5" aria-hidden />
              </span>
              <span className="text-caption font-bold uppercase tracking-widest text-primary">
                Configurações · Separação
              </span>
            </div>
            <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
              {isEditing ? 'Editar regra de produtividade' : 'Nova regra de produtividade'}
            </h1>
          </div>

          <FormProvider {...form}>
            <form onSubmit={onSubmit}>
              <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
                <div className="space-y-4">
                  <CollapsiblePanelSection icon={FileText} title="Identificação">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label htmlFor="nome" className="text-xs font-medium text-foreground">
                          Nome do perfil
                        </label>
                        <input
                          id="nome"
                          {...register('nome')}
                          placeholder="Ex.: Perfil Alfa Separação"
                          className={fieldInputClassName}
                        />
                        {errors.nome && (
                          <p className="text-[10px] text-destructive">{errors.nome.message}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="descricao" className="text-xs font-medium text-foreground">
                          Descrição
                        </label>
                        <textarea
                          id="descricao"
                          {...register('descricao')}
                          rows={2}
                          placeholder="Contexto de uso deste perfil..."
                          className={cn(fieldInputClassName, 'resize-none')}
                        />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex items-center justify-between gap-2 rounded-md border border-outline-variant/60 bg-surface-low/20 px-2.5 py-2">
                          <span className="text-xs font-medium text-foreground">Ativo</span>
                          <Controller
                            name="ativo"
                            control={control}
                            render={({ field }) => (
                              <SwitchToggle
                                checked={field.value}
                                onChange={() => field.onChange(!field.value)}
                                label="Ativo"
                              />
                            )}
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2 rounded-md border border-outline-variant/60 bg-surface-low/20 px-2.5 py-2">
                          <span className="text-xs font-medium text-foreground">
                            Perfil padrão do CD
                          </span>
                          <Controller
                            name="padrao"
                            control={control}
                            render={({ field }) => (
                              <SwitchToggle
                                checked={field.value}
                                onChange={() => field.onChange(!field.value)}
                                label="Perfil padrão"
                              />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </CollapsiblePanelSection>

                  <CollapsiblePanelSection icon={Clock} title="Tempos de separação">
                    <ParametrosTempoPanel
                      register={register}
                      errors={errors}
                      variant="separacao"
                    />
                  </CollapsiblePanelSection>

                  <CollapsiblePanelSection icon={Clock} title="Gordura do mapa">
                    <p className={cn(sectionLabelClassName, 'mb-3 normal-case tracking-normal')}>
                      Margem de segurança no início e fim da execução do mapa.
                    </p>
                    <ParametrosTempoPanel
                      register={register}
                      errors={errors}
                      variant="gordura"
                    />
                  </CollapsiblePanelSection>
                </div>

                <div className="lg:sticky lg:top-6">
                  <TempoEsperadoPreview
                    params={watchedValues}
                    qtdItens={simQtdItens}
                    qtdEnderecos={simQtdEnderecos}
                    qtdItensSemEndereco={simQtdItensSemEndereco}
                    onQtdItensChange={setSimQtdItens}
                    onQtdEnderecosChange={setSimQtdEnderecos}
                    onQtdItensSemEnderecoChange={setSimQtdItensSemEndereco}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-outline-variant pt-6">
                <Button type="submit" size="sm" className="gap-1.5" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Save className="size-4" aria-hidden />
                  )}
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={cancelar}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </FormProvider>
        </div>
      </main>
    </SidebarMain>
  );
}
