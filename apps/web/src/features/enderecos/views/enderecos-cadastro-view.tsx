'use client';

import { Button, cn } from '@lilog/ui';
import {
  Loader2,
  MapPin,
  Pin,
  Ruler,
  Scale,
} from 'lucide-react';
import Link from 'next/link';
import { FormProvider } from 'react-hook-form';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  CurvaAbcBadge,
} from '@/features/enderecos/components/endereco-status-badge';
import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
  sectionCardClassName,
} from '@/features/enderecos/components/form-field-classes';
import { LabelPreviewCard } from '@/features/enderecos/components/label-preview';
import { useEnderecoCadastro } from '@/features/enderecos/hooks/use-endereco-cadastro';
import { ENDERECO_TIPO_LABELS, getTipoEstruturaOpcoes, isEnderecoTipoEstruturado } from '@/features/enderecos/types/enderecos-gestao.schema';
import type { CurvaAbc } from '@/features/enderecos/types/enderecos-gestao.schema';

export function EnderecosCadastroView() {
  const {
    form,
    isSubmitting,
    unidadeLabel,
    onSubmit,
    cancelar,
    volumeTeoricoM3,
    labelPreview,
    enderecoCodigo,
  } = useEnderecoCadastro();

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const curvaAbc = watch('curvaAbc');
  const tipo = watch('tipo');
  const vinculoSkuFixo = watch('vinculoSkuFixo');
  const regraLoteUnico = watch('regraLoteUnico');
  const isTipoEstruturado = isEnderecoTipoEstruturado(tipo);

  return (
    <FormProvider {...form}>
      <SidebarMain className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-4 border-b border-outline-variant bg-glass-bg px-margin-mobile py-4 backdrop-blur-glass md:px-margin-desktop">
          <nav
            aria-label="Navegação estrutural"
            className="flex items-center gap-2 text-label-md"
          >
            <Link
              href="/enderecos"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Endereços
            </Link>
            <span className="text-muted-foreground" aria-hidden>
              /
            </span>
            <span className="font-semibold text-foreground">Novo endereço</span>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-outline-variant hover:bg-muted"
              onClick={cancelar}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="endereco-cadastro-form"
              disabled={isSubmitting || !unidadeLabel || unidadeLabel === '—'}
              className="min-w-[9rem]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Salvando…
                </>
              ) : (
                'Criar endereço'
              )}
            </Button>
          </div>
        </header>

        <main className="flex-1 bg-background px-margin-mobile py-8 md:px-margin-desktop md:pb-12">
          <form
            id="endereco-cadastro-form"
            className="mx-auto max-w-container"
            onSubmit={onSubmit}
            noValidate
          >
            <div className="mb-8">
              <div className="mb-1 flex items-center gap-2 text-label-md text-tertiary">
                <MapPin className="size-4" aria-hidden />
                <span>Cadastro de posição</span>
              </div>
              <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
                Novo Endereço
              </h1>
              <p className="mt-1 max-w-2xl text-body-md text-muted-foreground">
                Cadastre locais físicos do armazém — posições de rack, docas
                ou áreas operacionais. O código segue o padrão{' '}
                <span className="font-mono font-semibold text-primary">
                  ZONA · RUA · POSIÇÃO · NÍVEL
                </span>
                .
              </p>
            </div>

            <div className="grid grid-cols-12 gap-gutter">
              <div className="col-span-12 space-y-gutter lg:col-span-8">
                <section className={sectionCardClassName}>
                  <div className="mb-6 flex items-center gap-3 border-b border-outline-variant pb-4">
                    <Pin className="size-5 text-primary" aria-hidden />
                    <h2 className="text-headline-md font-semibold">
                      1. Identificação e Localização
                    </h2>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className={fieldLabelClassName}>
                        Código do Endereço
                      </label>
                      <div className="mt-2 rounded-lg border border-outline-variant bg-surface-low px-4 py-3 font-mono text-primary">
                        {enderecoCodigo}
                      </div>
                    </div>
                    <div>
                      <label className={fieldLabelClassName}>Unidade</label>
                      <div className="mt-2 rounded-lg border border-outline-variant bg-surface-low px-4 py-3 text-body-md">
                        {unidadeLabel}
                      </div>
                    </div>
                    <div>
                      <label className={fieldLabelClassName} htmlFor="zona">
                        Zona
                      </label>
                      <input
                        id="zona"
                        type="text"
                        placeholder="A"
                        maxLength={10}
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
                      <label className={fieldLabelClassName} htmlFor="rua">
                        Rua
                        {!isTipoEstruturado && (
                          <span className="ml-1 font-normal text-muted-foreground">
                            (opcional)
                          </span>
                        )}
                      </label>
                      <input
                        id="rua"
                        type="text"
                        placeholder={isTipoEstruturado ? '001' : '— (opcional)'}
                        className={cn(fieldInputClassName, 'mt-2 font-mono')}
                        {...register('rua')}
                      />
                      {errors.rua && (
                        <p className={fieldErrorClassName}>
                          {errors.rua.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={fieldLabelClassName} htmlFor="posicao">
                        Posição
                        {!isTipoEstruturado && (
                          <span className="ml-1 font-normal text-muted-foreground">
                            (opcional)
                          </span>
                        )}
                      </label>
                      <input
                        id="posicao"
                        type="text"
                        placeholder={isTipoEstruturado ? '0001' : '— (opcional)'}
                        className={cn(fieldInputClassName, 'mt-2 font-mono')}
                        {...register('posicao')}
                      />
                      {errors.posicao && (
                        <p className={fieldErrorClassName}>
                          {errors.posicao.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={fieldLabelClassName} htmlFor="nivel">
                        Nível
                        {!isTipoEstruturado && (
                          <span className="ml-1 font-normal text-muted-foreground">
                            (opcional)
                          </span>
                        )}
                      </label>
                      <input
                        id="nivel"
                        type="text"
                        placeholder={isTipoEstruturado ? '01' : '— (opcional)'}
                        className={cn(fieldInputClassName, 'mt-2 font-mono')}
                        {...register('nivel')}
                      />
                      {errors.nivel && (
                        <p className={fieldErrorClassName}>
                          {errors.nivel.message}
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
                        {getTipoEstruturaOpcoes(tipo).map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {!isTipoEstruturado && (
                    <p className="mt-4 rounded-lg border border-outline-variant/40 bg-surface-lowest px-4 py-3 text-sm text-muted-foreground">
                      Para tipos como Área Operacional, Recebimento, Expedição,
                      Avaria e Cross-docking, basta informar a{' '}
                      <span className="font-semibold text-foreground">Zona</span>{' '}
                      (ex: <span className="font-mono">DOCA-1</span> ou{' '}
                      <span className="font-mono">RECEB</span>). O código final
                      será apenas a zona quando Rua, Posição e Nível estiverem
                      vazios.
                    </p>
                  )}
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
                  <div className="rounded-lg border border-outline-variant/30 bg-surface-lowest p-4">
                    <span className="block text-xs uppercase text-muted-foreground">
                      Volume Teórico Calculado
                    </span>
                    <span className="text-headline-md font-bold text-tertiary">
                      {volumeTeoricoM3.toFixed(2)} m³
                    </span>
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
                            <p className="text-xs text-muted-foreground">
                              {desc}
                            </p>
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

              <div className="col-span-12 lg:col-span-4">
                <LabelPreviewCard preview={labelPreview} />
              </div>
            </div>
          </form>
        </main>
      </SidebarMain>
    </FormProvider>
  );
}
