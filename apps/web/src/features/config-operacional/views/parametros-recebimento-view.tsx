'use client';

import Link from 'next/link';

import { Button, cn } from '@lilog/ui';
import { ArrowLeft, Loader2, Plus, Save, Trash2, Truck } from 'lucide-react';
import { Controller, FormProvider, useFieldArray } from 'react-hook-form';

import { SidebarMain } from '@/components/layout/sidebar';
import { CollapsiblePanelSection } from '@/components/ui/collapsible-panel-section';
import { SwitchToggle } from '@/components/ui/switch-toggle';
import { useParametrosRecebimento } from '@/features/config-operacional/hooks/use-parametros-recebimento';

const DISPLAY_UNIDADE_OPCOES = [
  { value: 'CX', label: 'Caixa (CX)', description: 'Relatórios e telas web exibem quantidades em caixas' },
  { value: 'UN', label: 'Unidade (UN)', description: 'Relatórios e telas web exibem quantidades em unidades' },
] as const;

const QUANTIDADE_OPCOES = [
  { value: 'caixa', label: 'Caixa', description: 'Conferência apenas em caixas' },
  {
    value: 'unidade',
    label: 'Unidade',
    description: 'Conferência apenas em unidades',
  },
  {
    value: 'ambos',
    label: 'Ambos',
    description: 'Exibe caixa e unidade no formulário',
  },
] as const;

const LOTE_OPCOES = [
  { value: 'lote', label: 'Lote', description: 'Campo de lote (batch)' },
  {
    value: 'fabricacao',
    label: 'Fabricação',
    description: 'Campo de data de fabricação',
  },
  {
    value: 'ambos',
    label: 'Ambos',
    description: 'Exibe lote e data de fabricação',
  },
] as const;

function RadioOption({
  name,
  value,
  label,
  description,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
        checked
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/40',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-1"
      />
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

function CondicoesChecklistSection({
  control,
}: {
  control: ReturnType<typeof useParametrosRecebimento>['form']['control'];
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'condicoesChecklist',
  });

  return (
    <CollapsiblePanelSection title="Condições do checklist" defaultExpanded>
      <div className="space-y-4 p-4">
        <p className="text-sm text-muted-foreground">
          Define os itens de verificação exibidos no checklist de entrada do PWA (ex.: limpeza,
          integridade, vedação).
        </p>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-start"
            >
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <Controller
                  control={control}
                  name={`condicoesChecklist.${index}.id`}
                  render={({ field: idField, fieldState }) => (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Identificador
                      </label>
                      <input
                        {...idField}
                        placeholder="ex: limpeza"
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      />
                      {fieldState.error ? (
                        <p className="mt-1 text-xs text-destructive">{fieldState.error.message}</p>
                      ) : null}
                    </div>
                  )}
                />
                <Controller
                  control={control}
                  name={`condicoesChecklist.${index}.label`}
                  render={({ field: labelField, fieldState }) => (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Rótulo exibido
                      </label>
                      <input
                        {...labelField}
                        placeholder="ex: Limpeza Interna"
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                      />
                      {fieldState.error ? (
                        <p className="mt-1 text-xs text-destructive">{fieldState.error.message}</p>
                      ) : null}
                    </div>
                  )}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
                disabled={fields.length <= 1}
                onClick={() => remove(index)}
                aria-label="Remover condição"
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={fields.length >= 20}
          onClick={() =>
            append({
              id: `condicao_${fields.length + 1}`,
              label: '',
            })
          }
        >
          <Plus className="size-4" aria-hidden />
          Adicionar condição
        </Button>
      </div>
    </CollapsiblePanelSection>
  );
}

export function ParametrosRecebimentoView() {
  const { form, isLoading, isSubmitting, onSubmit, unidadeSelecionada } =
    useParametrosRecebimento();

  const { control, watch } = form;
  const watched = watch();

  if (isLoading) {
    return (
      <SidebarMain>
        <main className="flex min-h-dvh items-center justify-center px-margin-mobile py-12 md:px-margin-desktop">
          <div className="text-center">
            <Loader2
              className="mx-auto size-8 animate-spin text-muted-foreground"
              aria-hidden
            />
            <p className="mt-3 text-sm text-muted-foreground">Carregando parâmetros…</p>
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
              <Link href="/config-operacional">
                <ArrowLeft className="size-4" aria-hidden />
                Voltar
              </Link>
            </Button>

            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary-container text-on-primary-container">
                <Truck className="size-5" aria-hidden />
              </span>
              <span className="text-caption font-bold uppercase tracking-widest text-primary">
                Configurações · Recebimento
              </span>
            </div>
            <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
              Parâmetros de Conferência Recebimento
            </h1>
            <p className="mt-1 max-w-2xl text-body-md text-muted-foreground">
              Define quais campos o operador vê no PWA ao conferir itens de recebimento e no
              checklist de entrada
              {unidadeSelecionada ? ` — ${unidadeSelecionada.nome}` : ''}.
            </p>
          </div>

          <FormProvider {...form}>
            <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-4">
                <CollapsiblePanelSection title="Modo de quantidade" defaultExpanded>
                  <div className="space-y-3 p-4">
                    <Controller
                      control={control}
                      name="quantidadeModo"
                      render={({ field }) => (
                        <>
                          {QUANTIDADE_OPCOES.map((opcao) => (
                            <RadioOption
                              key={opcao.value}
                              name="quantidadeModo"
                              value={opcao.value}
                              label={opcao.label}
                              description={opcao.description}
                              checked={field.value === opcao.value}
                              onChange={() => field.onChange(opcao.value)}
                            />
                          ))}
                        </>
                      )}
                    />
                  </div>
                </CollapsiblePanelSection>

                <CollapsiblePanelSection title="Exibição de quantidades (Web)" defaultExpanded>
                  <div className="space-y-4 p-4">
                    <p className="text-sm text-muted-foreground">
                      Define como conferência, CNC e relatórios do portal web exibem
                      quantidades. O armazenamento interno continua em unidade base (UN).
                    </p>

                    <Controller
                      control={control}
                      name="displayUnidadePadrao"
                      render={({ field }) => (
                        <div className="space-y-3">
                          {DISPLAY_UNIDADE_OPCOES.map((opcao) => (
                            <RadioOption
                              key={opcao.value}
                              name="displayUnidadePadrao"
                              value={opcao.value}
                              label={opcao.label}
                              description={opcao.description}
                              checked={field.value === opcao.value}
                              onChange={() => field.onChange(opcao.value)}
                            />
                          ))}
                        </div>
                      )}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Controller
                        control={control}
                        name="displayDecimaisCaixa"
                        render={({ field, fieldState }) => (
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                              Casas decimais (CX)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={4}
                              value={field.value}
                              onChange={(event) =>
                                field.onChange(Number(event.target.value))
                              }
                              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                            />
                            {fieldState.error ? (
                              <p className="mt-1 text-xs text-destructive">
                                {fieldState.error.message}
                              </p>
                            ) : null}
                          </div>
                        )}
                      />

                      <Controller
                        control={control}
                        name="displayDecimaisUnidade"
                        render={({ field, fieldState }) => (
                          <div>
                            <label className="mb-1.5 block text-sm font-medium text-foreground">
                              Casas decimais (UN)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={3}
                              value={field.value}
                              onChange={(event) =>
                                field.onChange(Number(event.target.value))
                              }
                              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                            />
                            {fieldState.error ? (
                              <p className="mt-1 text-xs text-destructive">
                                {fieldState.error.message}
                              </p>
                            ) : null}
                          </div>
                        )}
                      />
                    </div>
                  </div>
                </CollapsiblePanelSection>

                <CollapsiblePanelSection title="Modo de rastreabilidade" defaultExpanded>
                  <div className="space-y-3 p-4">
                    <Controller
                      control={control}
                      name="loteModo"
                      render={({ field }) => (
                        <>
                          {LOTE_OPCOES.map((opcao) => (
                            <RadioOption
                              key={opcao.value}
                              name="loteModo"
                              value={opcao.value}
                              label={opcao.label}
                              description={opcao.description}
                              checked={field.value === opcao.value}
                              onChange={() => field.onChange(opcao.value)}
                            />
                          ))}
                        </>
                      )}
                    />
                  </div>
                </CollapsiblePanelSection>

                <CollapsiblePanelSection title="ID do palete / WMS" defaultExpanded>
                  <div className="p-4">
                    <Controller
                      control={control}
                      name="controlaPalete"
                      render={({ field }) => (
                        <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Exibir campo de palete
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Quando ativo, o operador deve informar o ID do palete ou
                              endereço WMS em cada lote conferido.
                            </p>
                          </div>
                          <SwitchToggle
                            checked={field.value}
                            onChange={() => field.onChange(!field.value)}
                            label="Exibir ID do palete / WMS"
                          />
                        </div>
                      )}
                    />
                  </div>
                </CollapsiblePanelSection>

                <CollapsiblePanelSection title="Solicitar peso (PVAR)" defaultExpanded>
                  <div className="p-4">
                    <Controller
                      control={control}
                      name="solicitarPesoPvar"
                      render={({ field }) => (
                        <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Exigir peso para produtos PVAR
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Quando ativo, o operador deve informar o peso recebido para
                              itens do tipo PVAR (peso variável) durante a conferência.
                            </p>
                          </div>
                          <SwitchToggle
                            checked={field.value}
                            onChange={() => field.onChange(!field.value)}
                            label="Solicitar peso para produtos PVAR"
                          />
                        </div>
                      )}
                    />
                  </div>
                </CollapsiblePanelSection>

                <CollapsiblePanelSection title="Etiqueta por caixa (PVAR)" defaultExpanded>
                  <div className="p-4">
                    <Controller
                      control={control}
                      name="exigirEtiquetaPesoVariavel"
                      render={({ field }) => (
                        <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Exigir etiqueta por caixa (PVAR)
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Quando ativo, o operador deve bipar ou informar a
                              etiqueta de cada caixa pesada. A etiqueta deve ser
                              única na unidade.
                            </p>
                          </div>
                          <SwitchToggle
                            checked={field.value}
                            onChange={() => field.onChange(!field.value)}
                            label="Exigir etiqueta por caixa PVAR"
                          />
                        </div>
                      )}
                    />
                  </div>
                </CollapsiblePanelSection>

                <CondicoesChecklistSection control={control} />
              </div>

              <aside className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <h2 className="text-sm font-semibold text-foreground">Resumo</h2>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>
                      Quantidade:{' '}
                      <strong className="text-foreground">
                        {
                          QUANTIDADE_OPCOES.find(
                            (o) => o.value === watched.quantidadeModo,
                          )?.label
                        }
                      </strong>
                    </li>
                    <li>
                      Rastreabilidade:{' '}
                      <strong className="text-foreground">
                        {LOTE_OPCOES.find((o) => o.value === watched.loteModo)?.label}
                      </strong>
                    </li>
                    <li>
                      Palete / WMS:{' '}
                      <strong className="text-foreground">
                        {watched.controlaPalete ? 'Obrigatório' : 'Oculto'}
                      </strong>
                    </li>
                    <li>
                      Peso PVAR:{' '}
                      <strong className="text-foreground">
                        {watched.solicitarPesoPvar ? 'Obrigatório' : 'Oculto'}
                      </strong>
                    </li>
                    <li>
                      Etiqueta PVAR:{' '}
                      <strong className="text-foreground">
                        {watched.exigirEtiquetaPesoVariavel
                          ? 'Obrigatória'
                          : 'Opcional'}
                      </strong>
                    </li>
                    <li>
                      Condições checklist:{' '}
                      <strong className="text-foreground">
                        {watched.condicoesChecklist?.length ?? 0} item(ns)
                      </strong>
                    </li>
                    <li>
                      Exibição web:{' '}
                      <strong className="text-foreground">
                        {
                          DISPLAY_UNIDADE_OPCOES.find(
                            (o) => o.value === watched.displayUnidadePadrao,
                          )?.label
                        }
                      </strong>
                      {' · '}
                      CX {watched.displayDecimaisCaixa} dec. / UN{' '}
                      {watched.displayDecimaisUnidade} dec.
                    </li>
                  </ul>
                </div>

                <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Save className="size-4" aria-hidden />
                  )}
                  Salvar parâmetros
                </Button>
              </aside>
            </form>
          </FormProvider>
        </div>
      </main>
    </SidebarMain>
  );
}
