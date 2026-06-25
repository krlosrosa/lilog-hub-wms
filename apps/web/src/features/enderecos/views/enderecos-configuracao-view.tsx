'use client';

import Link from 'next/link';

import {
  History,
  MapPin,
  Pin,
  Ruler,
  Scale,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';
import { ChangeLogTimeline } from '@/features/enderecos/components/change-log-item';
import {
  CurvaAbcBadge,
  EnderecoLockedField,
} from '@/features/enderecos/components/endereco-status-badge';
import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  sectionCardClassName,
} from '@/features/enderecos/components/form-field-classes';
import { LabelPreviewCard } from '@/features/enderecos/components/label-preview';
import { useEnderecosConfiguracao } from '@/features/enderecos/hooks/use-enderecos-configuracao';
import { TIPO_ESTRUTURA_OPCOES } from '@/features/enderecos/mocks/enderecos-detail-mock-data';
import { ENDERECO_TIPO_LABELS } from '@/features/enderecos/types/enderecos-gestao.schema';
import type { CurvaAbc } from '@/features/enderecos/types/enderecos-gestao.schema';

type EnderecosConfiguracaoViewProps = {
  enderecoId: string;
};

export function EnderecosConfiguracaoView({
  enderecoId,
}: EnderecosConfiguracaoViewProps) {
  const {
    form,
    isLoading,
    enderecoTag,
    volumeTeoricoM3,
    ocupacaoAtualPercent,
    labelPreview,
    changeLog,
    centroOpcoes,
    salvar,
    descartar,
    imprimirEtiqueta,
    verHistoricoCompleto,
  } = useEnderecosConfiguracao({ enderecoId });

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const curvaAbc = watch('curvaAbc');
  const vinculoSkuFixo = watch('vinculoSkuFixo');
  const regraLoteUnico = watch('regraLoteUnico');

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container">
          <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="mb-1 flex items-center gap-2 text-label-md text-tertiary">
                <MapPin className="size-4" aria-hidden />
                <span>{enderecoTag}</span>
              </div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Configuração Técnica de Endereço
              </h1>
              <p className="mt-1 text-body-md text-muted-foreground">
                Gestão de parâmetros volumétricos e regras logísticas de
                precisão.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={descartar}
                disabled={isLoading}
              >
                Descartar
              </Button>
              <Button
                type="button"
                onClick={() => void salvar()}
                disabled={isLoading}
              >
                Salvar Alterações
              </Button>
            </div>
          </header>

          <form
            onSubmit={(e) => void salvar(e)}
            className="grid grid-cols-12 gap-gutter"
          >
            <div className="col-span-12 space-y-gutter lg:col-span-8">
              <section className={sectionCardClassName}>
                <div className="mb-6 flex items-center gap-3 border-b border-outline-variant pb-4">
                  <Pin className="size-5 text-primary" aria-hidden />
                  <h2 className="text-headline-md font-semibold">
                    1. Identificação e Localização
                  </h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className={fieldLabelClassName}>
                      Endereço Mascarado (Tag)
                    </label>
                    <EnderecoLockedField
                      value={watch('enderecoMascarado')}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className={fieldLabelClassName} htmlFor="centroId">
                      Centro
                    </label>
                    <select
                      id="centroId"
                      className={cn(fieldInputClassName, 'mt-2')}
                      disabled={isLoading || centroOpcoes.length === 0}
                      {...register('centroId')}
                    >
                      {centroOpcoes.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    {errors.centroId && (
                      <p className={fieldErrorClassName}>
                        {errors.centroId.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={fieldLabelClassName} htmlFor="zona">
                      Zona
                    </label>
                    <input
                      id="zona"
                      type="text"
                      className={cn(fieldInputClassName, 'mt-2')}
                      {...register('zona')}
                    />
                    {errors.zona && (
                      <p className={fieldErrorClassName}>
                        {errors.zona.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={fieldLabelClassName} htmlFor="tipo">
                      Tipo de Endereço
                    </label>
                    <select
                      id="tipo"
                      className={cn(fieldInputClassName, 'mt-2')}
                      {...register('tipo')}
                    >
                      {Object.entries(ENDERECO_TIPO_LABELS).map(
                        ([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                    {errors.tipo && (
                      <p className={fieldErrorClassName}>
                        {errors.tipo.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className={fieldLabelClassName} htmlFor="tipoEstrutura">
                      Tipo de Estrutura
                    </label>
                    <select
                      id="tipoEstrutura"
                      className={cn(fieldInputClassName, 'mt-2')}
                      {...register('tipoEstrutura')}
                    >
                      {TIPO_ESTRUTURA_OPCOES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              <section className={sectionCardClassName}>
                <div className="mb-6 flex items-center gap-3 border-b border-outline-variant pb-4">
                  <Ruler className="size-5 text-primary" aria-hidden />
                  <h2 className="text-headline-md font-semibold">
                    2. Dimensões e Capacidade
                  </h2>
                </div>
                <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {(
                    [
                      ['larguraMm', 'Largura (mm)'],
                      ['alturaMm', 'Altura (mm)'],
                      ['profundidadeMm', 'Profundidade (mm)'],
                      ['cargaMaxKg', 'Carga Máx (kg)'],
                    ] as const
                  ).map(([field, label]) => (
                    <div key={field}>
                      <label className={fieldLabelClassName} htmlFor={field}>
                        {label}
                      </label>
                      <input
                        id={field}
                        type="number"
                        className={cn(
                          fieldInputClassName,
                          'mt-2 font-mono',
                          field === 'cargaMaxKg' && 'font-bold text-primary',
                        )}
                        {...register(field, { valueAsNumber: true })}
                      />
                      {errors[field] && (
                        <p className={fieldErrorClassName}>
                          {errors[field]?.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col justify-between gap-4 rounded-lg border border-outline-variant/30 bg-surface-lowest p-4 sm:flex-row sm:items-center">
                  <div>
                    <span className="block text-xs uppercase text-muted-foreground">
                      Volume Teórico Calculado
                    </span>
                    <span className="text-headline-md font-bold text-tertiary">
                      {volumeTeoricoM3.toFixed(2)} m³
                    </span>
                  </div>
                  <div className="w-full sm:w-1/2">
                    <div className="mb-1 flex justify-between text-[10px] uppercase text-muted-foreground">
                      <span>Ocupação Atual</span>
                      <span>{ocupacaoAtualPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-tertiary"
                        style={{ width: `${ocupacaoAtualPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className={sectionCardClassName}>
                <div className="mb-6 flex items-center gap-3 border-b border-outline-variant pb-4">
                  <Scale className="size-5 text-primary" aria-hidden />
                  <h2 className="text-headline-md font-semibold">
                    3. Regras Logísticas
                  </h2>
                </div>
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-6">
                    {(
                      [
                        [
                          'vinculoSkuFixo',
                          'Vínculo de SKU Fixo',
                          'Restringe este endereço a um SKU específico.',
                          vinculoSkuFixo,
                        ],
                        [
                          'regraLoteUnico',
                          'Regra de Lote Único',
                          'Proibe mistura de lotes no mesmo picking.',
                          regraLoteUnico,
                        ],
                      ] as const
                    ).map(([field, title, desc, checked]) => (
                      <div
                        key={field}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <label className="block text-label-md text-foreground">
                            {title}
                          </label>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={checked}
                          onClick={() =>
                            setValue(field, !checked, { shouldDirty: true })
                          }
                          className={cn(
                            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                            checked ? 'bg-primary' : 'bg-surface-highest',
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block size-5 rounded-full bg-background transition-transform',
                              checked ? 'translate-x-5' : 'translate-x-0.5',
                            )}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={fieldLabelClassName}>
                        Classificação Curva ABC
                      </label>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {(['A', 'B', 'C'] as CurvaAbc[]).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setValue('curvaAbc', c)}
                            className={cn(
                              'rounded py-2 text-sm font-bold transition-colors',
                              curvaAbc === c
                                ? c === 'A'
                                  ? 'border border-destructive/30 bg-destructive/20 text-destructive-foreground'
                                  : 'border border-primary/30 bg-primary/10 text-primary'
                                : 'border border-outline-variant bg-surface-low text-muted-foreground',
                            )}
                          >
                            Classe {c}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2">
                        <CurvaAbcBadge curva={curvaAbc} />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="col-span-12 space-y-gutter lg:col-span-4">
              <LabelPreviewCard
                preview={labelPreview}
                onPrint={imprimirEtiqueta}
              />

              <section className={sectionCardClassName}>
                <div className="mb-6 flex items-center gap-3 border-b border-outline-variant pb-4">
                  <History className="size-5 text-primary" aria-hidden />
                  <h3 className="text-headline-md font-semibold">
                    Log de Alterações
                  </h3>
                </div>
                <ChangeLogTimeline
                  items={changeLog}
                  onVerCompleto={verHistoricoCompleto}
                />
              </section>
            </div>
          </form>

          <div className="mt-6">
            <Button variant="link" asChild className="px-0">
              <Link href="/enderecos">← Voltar para gestão</Link>
            </Button>
          </div>
        </div>
      </main>
    </SidebarMain>
  );
}
