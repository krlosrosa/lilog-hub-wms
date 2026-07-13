'use client';

import Link from 'next/link';

import {
  Button,
  cn,
} from '@lilog/ui';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';
import {
  compactTableBodyClassName,
  compactTableCellClassName,
  compactTableClassName,
  compactTableEmptyCellClassName,
  compactTableHeadCellClassName,
  compactTableHeadRowClassName,
  compactTableRowClassName,
} from '@/components/ui/compact-table-classes';
import { Pagination } from '@/features/filiais/components/pagination';
import {
  CurvaAbcBadge,
} from '@/features/enderecos/components/endereco-status-badge';
import {
  fieldInputClassName,
  fieldLabelClassName,
  sectionCardClassName,
} from '@/features/enderecos/components/form-field-classes';
import { useCadastroLote } from '@/features/enderecos/hooks/use-cadastro-lote';
import {
  NIVEIS_LOTE_OPCOES,
  calcularQuantidadeRua,
} from '@/features/enderecos/types/endereco-lote.schema';
import {
  ENDERECO_TIPO_LABELS,
  ENDERECO_TIPO_ESTRUTURA_LABELS,
  getTipoEstruturaOpcoes,
  type CurvaAbc,
  type EnderecoTipo,
} from '@/features/enderecos/types/enderecos-gestao.schema';

const STEP_LABELS = ['Configuração', 'Ruas', 'Preview'] as const;

export function EnderecosCadastroLoteView() {
  const {
    step,
    configuracao,
    ruas,
    previewItems,
    previewItemsPagina,
    previewPagina,
    previewPageSize,
    totalPreviewPaginas,
    totalEstimado,
    isSubmitting,
    unidadeLabel,
    atualizarConfiguracao,
    adicionarRua,
    removerRua,
    atualizarRua,
    toggleNivelRua,
    avancarEtapa,
    voltarEtapa,
    toggleEditarItem,
    updateItemField,
    removerItem,
    removerTodos,
    setPreviewPagina,
    submeter,
    cancelar,
  } = useCadastroLote();

  return (
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
          <span className="font-semibold text-foreground">Cadastro em Lote</span>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" onClick={cancelar}>
            Cancelar
          </Button>
          {step > 1 && (
            <Button type="button" variant="outline" onClick={voltarEtapa}>
              Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" onClick={avancarEtapa}>
              Continuar
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isSubmitting || previewItems.length === 0 || !unidadeLabel || unidadeLabel === '—'}
              onClick={() => void submeter()}
              className="min-w-[10rem]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Salvando…
                </>
              ) : (
                `Criar ${previewItems.length} endereço${previewItems.length === 1 ? '' : 's'}`
              )}
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 bg-background px-margin-mobile py-8 md:px-margin-desktop md:pb-12">
        <div className="mx-auto max-w-container space-y-6">
          <div>
            <div className="mb-1 flex items-center gap-2 text-label-md text-tertiary">
              <Layers className="size-4" aria-hidden />
              <span>Geração em massa</span>
            </div>
            <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-foreground md:text-headline-lg">
              Cadastro em Lote de Endereços
            </h1>
            <p className="mt-1 max-w-3xl text-body-md text-muted-foreground">
              Configure galpão, ruas e níveis. Revise e edite cada endereço antes
              de confirmar o cadastro.
            </p>
          </div>

          <ol className="flex flex-wrap items-center gap-2">
            {STEP_LABELS.map((label, index) => {
              const stepNumber = (index + 1) as 1 | 2 | 3;
              const active = step === stepNumber;
              const done = step > stepNumber;

              return (
                <li
                  key={label}
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                    active
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : done
                        ? 'border-tertiary/30 bg-tertiary/10 text-tertiary'
                        : 'border-outline-variant bg-surface-highest text-muted-foreground',
                  )}
                >
                  <span className="font-mono">{stepNumber}</span>
                  {label}
                </li>
              );
            })}
          </ol>

          {step === 1 && (
            <section className={sectionCardClassName}>
              <div className="mb-6 border-b border-outline-variant pb-4">
                <h2 className="text-headline-md font-semibold">
                  1. Configuração Base
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Parâmetros aplicados a todos os endereços gerados. Unidade:{' '}
                  <span className="font-semibold text-foreground">{unidadeLabel}</span>
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className={fieldLabelClassName} htmlFor="zona">
                    Galpão / Zona
                  </label>
                  <input
                    id="zona"
                    type="text"
                    value={configuracao.zona}
                    onChange={(e) => atualizarConfiguracao('zona', e.target.value)}
                    className={cn(fieldInputClassName, 'mt-2 font-mono uppercase')}
                    placeholder="A"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className={fieldLabelClassName} htmlFor="tipoEstrutura">
                    Tipo de Estrutura
                  </label>
                  <select
                    id="tipoEstrutura"
                    value={configuracao.tipoEstrutura}
                    onChange={(e) =>
                      atualizarConfiguracao(
                        'tipoEstrutura',
                        e.target.value as typeof configuracao.tipoEstrutura,
                      )
                    }
                    className={cn(fieldInputClassName, 'mt-2')}
                  >
                    {getTipoEstruturaOpcoes('picking').map((opcao) => (
                      <option key={opcao.value} value={opcao.value}>
                        {opcao.label}
                      </option>
                    ))}
                  </select>
                </div>

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
                      value={configuracao[field]}
                      onChange={(e) =>
                        atualizarConfiguracao(field, Number(e.target.value) || 0)
                      }
                      className={cn(fieldInputClassName, 'mt-2 font-mono')}
                    />
                  </div>
                ))}

                <div className="md:col-span-2">
                  <label className={fieldLabelClassName}>Curva ABC</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(['A', 'B', 'C'] as CurvaAbc[]).map((curva) => (
                      <button
                        key={curva}
                        type="button"
                        onClick={() => atualizarConfiguracao('curvaAbc', curva)}
                        className={cn(
                          'rounded py-2 text-sm font-bold transition-colors',
                          configuracao.curvaAbc === curva
                            ? 'border border-primary/30 bg-primary/10 text-primary'
                            : 'border border-outline-variant bg-surface-low text-muted-foreground',
                        )}
                      >
                        Classe {curva}
                      </button>
                    ))}
                  </div>
                </div>

                {(
                  [
                    ['vinculoSkuFixo', 'Vínculo de SKU Fixo'],
                    ['regraLoteUnico', 'Regra de Lote Único'],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field} className="flex items-center justify-between">
                    <label className="text-label-md text-foreground">{label}</label>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={configuracao[field]}
                      onClick={() =>
                        atualizarConfiguracao(field, !configuracao[field])
                      }
                      className={cn(
                        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                        configuracao[field] ? 'bg-primary' : 'bg-surface-highest',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block size-5 rounded-full bg-background transition-transform',
                          configuracao[field] ? 'translate-x-5' : 'translate-x-0.5',
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className={sectionCardClassName}>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant pb-4">
                <div>
                  <h2 className="text-headline-md font-semibold">2. Builder de Ruas</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Adicione ruas com intervalo de posições e níveis desejados.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={adicionarRua}>
                  <Plus className="size-3.5" aria-hidden />
                  Adicionar Rua
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className={compactTableClassName}>
                  <thead>
                    <tr className={compactTableHeadRowClassName}>
                      {['Rua', 'Pos. Inicial', 'Pos. Final', 'Níveis', 'Qtd.', ''].map(
                        (label) => (
                          <th
                            key={label || 'actions'}
                            className={compactTableHeadCellClassName()}
                          >
                            {label}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className={compactTableBodyClassName}>
                    {ruas.map((rua) => (
                      <tr key={rua.id} className={compactTableRowClassName}>
                        <td className={compactTableCellClassName}>
                          <input
                            type="text"
                            value={rua.rua}
                            onChange={(e) =>
                              atualizarRua(rua.id, 'rua', e.target.value)
                            }
                            className={cn(fieldInputClassName, 'h-8 font-mono text-xs')}
                          />
                        </td>
                        <td className={compactTableCellClassName}>
                          <input
                            type="number"
                            min={1}
                            value={rua.posicaoInicial}
                            onChange={(e) =>
                              atualizarRua(
                                rua.id,
                                'posicaoInicial',
                                Number(e.target.value) || 1,
                              )
                            }
                            className={cn(fieldInputClassName, 'h-8 w-20 font-mono text-xs')}
                          />
                        </td>
                        <td className={compactTableCellClassName}>
                          <input
                            type="number"
                            min={1}
                            value={rua.posicaoFinal}
                            onChange={(e) =>
                              atualizarRua(
                                rua.id,
                                'posicaoFinal',
                                Number(e.target.value) || 1,
                              )
                            }
                            className={cn(fieldInputClassName, 'h-8 w-20 font-mono text-xs')}
                          />
                        </td>
                        <td className={compactTableCellClassName}>
                          <div className="flex flex-wrap gap-1">
                            {NIVEIS_LOTE_OPCOES.map((nivel) => {
                              const selected = rua.niveis.includes(nivel);

                              return (
                                <button
                                  key={nivel}
                                  type="button"
                                  onClick={() => toggleNivelRua(rua.id, nivel)}
                                  className={cn(
                                    'rounded px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors',
                                    selected
                                      ? 'bg-primary/15 text-primary'
                                      : 'bg-surface-highest text-muted-foreground hover:bg-muted',
                                  )}
                                >
                                  {nivel}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className={cn(compactTableCellClassName, 'font-mono tabular-nums')}>
                          {calcularQuantidadeRua(rua)}
                        </td>
                        <td className={compactTableCellClassName}>
                          <button
                            type="button"
                            onClick={() => removerRua(rua.id)}
                            disabled={ruas.length <= 1}
                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                            aria-label={`Remover rua ${rua.rua}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 rounded-lg border border-outline-variant/40 bg-surface-lowest px-4 py-3 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {totalEstimado} endereço{totalEstimado === 1 ? '' : 's'}
                </span>{' '}
                serão gerados. Nível 10 = picking; acima de 10 = aéreo.
              </p>
            </section>
          )}

          {step === 3 && (
            <section className={sectionCardClassName}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant pb-4">
                <div>
                  <h2 className="text-headline-md font-semibold">
                    3. Preview e Edição
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {previewItems.length} endereço
                    {previewItems.length === 1 ? '' : 's'} para criar
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  disabled={previewItems.length === 0}
                  onClick={removerTodos}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Limpar lista
                </Button>
              </div>

              {previewItems.length === 0 ? (
                <p className={compactTableEmptyCellClassName}>
                  Nenhum endereço na lista. Volte e ajuste os parâmetros das ruas.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className={compactTableClassName}>
                      <thead>
                        <tr className={compactTableHeadRowClassName}>
                          {[
                            'Código',
                            'Rua',
                            'Pos.',
                            'Nív.',
                            'Tipo',
                            'Estrutura',
                            'Dimensões',
                            'Carga',
                            'ABC',
                            '',
                          ].map((label) => (
                            <th
                              key={label || 'actions'}
                              className={compactTableHeadCellClassName()}
                            >
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className={compactTableBodyClassName}>
                        {previewItemsPagina.map((item) => (
                          <tr key={item._id} className={compactTableRowClassName}>
                            <td className={cn(compactTableCellClassName, 'font-mono text-[11px] font-semibold text-primary')}>
                              {item.codigo}
                            </td>
                            <td className={cn(compactTableCellClassName, 'font-mono')}>
                              {item.rua}
                            </td>
                            <td className={cn(compactTableCellClassName, 'font-mono')}>
                              {item.posicao}
                            </td>
                            <td className={cn(compactTableCellClassName, 'font-mono')}>
                              {item.nivel}
                            </td>
                            <td className={compactTableCellClassName}>
                              {item._editando ? (
                                <select
                                  value={item.tipo}
                                  onChange={(e) =>
                                    updateItemField(
                                      item._id,
                                      'tipo',
                                      e.target.value as EnderecoTipo,
                                    )
                                  }
                                  className={cn(fieldInputClassName, 'h-8 text-xs')}
                                >
                                  {(['picking', 'aereo', 'pulmao'] as const).map(
                                    (tipo) => (
                                      <option key={tipo} value={tipo}>
                                        {ENDERECO_TIPO_LABELS[tipo]}
                                      </option>
                                    ),
                                  )}
                                </select>
                              ) : (
                                ENDERECO_TIPO_LABELS[item.tipo]
                              )}
                            </td>
                            <td className={compactTableCellClassName}>
                              {item._editando ? (
                                <select
                                  value={item.tipoEstrutura}
                                  onChange={(e) =>
                                    updateItemField(
                                      item._id,
                                      'tipoEstrutura',
                                      e.target.value as typeof item.tipoEstrutura,
                                    )
                                  }
                                  className={cn(fieldInputClassName, 'h-8 min-w-[8rem] text-xs')}
                                >
                                  {getTipoEstruturaOpcoes(item.tipo).map((opcao) => (
                                    <option key={opcao.value} value={opcao.value}>
                                      {opcao.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                ENDERECO_TIPO_ESTRUTURA_LABELS[item.tipoEstrutura]
                              )}
                            </td>
                            <td className={compactTableCellClassName}>
                              {item._editando ? (
                                <div className="flex gap-1">
                                  {(
                                    [
                                      ['larguraMm', 'L'],
                                      ['alturaMm', 'A'],
                                      ['profundidadeMm', 'P'],
                                    ] as const
                                  ).map(([field, label]) => (
                                    <input
                                      key={field}
                                      type="number"
                                      title={label}
                                      value={item[field]}
                                      onChange={(e) =>
                                        updateItemField(
                                          item._id,
                                          field,
                                          Number(e.target.value) || 0,
                                        )
                                      }
                                      className={cn(fieldInputClassName, 'h-8 w-14 text-xs')}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <span className="font-mono text-[11px] tabular-nums">
                                  {item.larguraMm}×{item.alturaMm}×{item.profundidadeMm}
                                </span>
                              )}
                            </td>
                            <td className={compactTableCellClassName}>
                              {item._editando ? (
                                <input
                                  type="number"
                                  value={item.cargaMaxKg}
                                  onChange={(e) =>
                                    updateItemField(
                                      item._id,
                                      'cargaMaxKg',
                                      Number(e.target.value) || 0,
                                    )
                                  }
                                  className={cn(fieldInputClassName, 'h-8 w-20 text-xs')}
                                />
                              ) : (
                                <span className="font-mono text-[11px] tabular-nums">
                                  {item.cargaMaxKg} kg
                                </span>
                              )}
                            </td>
                            <td className={compactTableCellClassName}>
                              {item._editando ? (
                                <div className="flex gap-1">
                                  {(['A', 'B', 'C'] as CurvaAbc[]).map((curva) => (
                                    <button
                                      key={curva}
                                      type="button"
                                      onClick={() =>
                                        updateItemField(item._id, 'curvaAbc', curva)
                                      }
                                      className={cn(
                                        'rounded px-1.5 py-0.5 text-[10px] font-bold',
                                        item.curvaAbc === curva
                                          ? 'bg-primary/15 text-primary'
                                          : 'bg-muted text-muted-foreground',
                                      )}
                                    >
                                      {curva}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <CurvaAbcBadge curva={item.curvaAbc} compact />
                              )}
                            </td>
                            <td className={compactTableCellClassName}>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => toggleEditarItem(item._id)}
                                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-primary"
                                  aria-label={
                                    item._editando
                                      ? `Confirmar edição de ${item.codigo}`
                                      : `Editar ${item.codigo}`
                                  }
                                >
                                  {item._editando ? (
                                    <Check className="size-3.5" />
                                  ) : (
                                    <Pencil className="size-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removerItem(item._id)}
                                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  aria-label={`Remover ${item.codigo}`}
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    pagina={previewPagina}
                    totalPaginas={totalPreviewPaginas}
                    onChangePagina={setPreviewPagina}
                    totalFiltrados={previewItems.length}
                    itemsInicio={
                      previewItems.length === 0
                        ? 0
                        : (previewPagina - 1) * previewPageSize + 1
                    }
                    pageSize={previewPageSize}
                    resourceLabelPlural="endereços"
                  />
                </>
              )}
            </section>
          )}

          {step < 3 && (
            <div className="flex justify-end">
              <Button type="button" onClick={avancarEtapa} className="gap-1.5">
                Continuar
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          )}

          {step === 3 && step > 1 && (
            <div className="flex justify-start">
              <Button type="button" variant="outline" onClick={voltarEtapa} className="gap-1.5">
                <ChevronLeft className="size-4" aria-hidden />
                Voltar para ruas
              </Button>
            </div>
          )}
        </div>
      </main>
    </SidebarMain>
  );
}
