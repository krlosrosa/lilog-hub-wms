'use client';

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  cn,
} from '@lilog/ui';
import {
  Check,
  Info,
  Layers,
  Loader2,
  Package,
  Plus,
  Scale,
  Settings2,
  Snowflake,
  Truck,
} from 'lucide-react';

import { SidebarMain } from '@/components/layout/sidebar';

import { PerfilCard } from '@/features/transporte/components/perfil-card';
import { PerfilTarifaFormDialog } from '@/features/transporte/components/perfil-tarifa-form-dialog';
import { PerfisTarifasSummary } from '@/features/transporte/components/perfis-tarifas-summary';
import { TipoCargaBadge } from '@/features/transporte/components/tipo-carga-badge';
import { formatarMoeda } from '@/features/transporte/lib/calcular-custo';
import { usePerfisTarifas } from '@/features/transporte/hooks/use-perfis-tarifas';
import type { TipoCargaFiltro } from '@/features/transporte/hooks/use-perfis-tarifas';
import type { TipoCarga } from '@/features/transporte/types/perfil-tarifa.schema';
import { TIPO_CARGA_LABELS } from '@/features/transporte/types/perfil-tarifa.schema';

const FILTROS_CARGA: {
  id: TipoCargaFiltro;
  label: string;
  icon: typeof Package;
}[] = [
  { id: null, label: 'Todos', icon: Layers },
  { id: 'seco', label: TIPO_CARGA_LABELS.seco, icon: Package },
  { id: 'refrigerado', label: TIPO_CARGA_LABELS.refrigerado, icon: Snowflake },
];

const inputClass = cn(
  'w-full rounded-lg border border-outline-variant bg-surface-low px-3 py-2',
  'text-sm text-foreground placeholder:text-muted-foreground',
  'transition-colors focus:outline-none focus:ring-1 focus:ring-ring',
);

const sectionPanelClass = cn(
  'rounded-xl border border-outline-variant/60',
  'bg-glass-bg shadow-inner-glow backdrop-blur-glass',
);

export function PerfisTarifasView() {
  const {
    tipoCargaFiltro,
    setTipoCargaFiltro,
    perfisFiltrados,
    isLoading,
    isSubmitting,
    unidadeId,
    dadosPerfilEditando,
    abrirEdicaoPerfil,
    atualizarCampoPerfil,
    salvarPerfil,
    cancelarEdicaoPerfil,
    perfilFormDialog,
    abrirCriarPerfil,
    fecharPerfilFormDialog,
    salvarNovoPerfil,
    tarifaEditandoId,
    faixasEditando,
    iniciarEdicaoTarifa,
    atualizarFaixa,
    adicionarFaixa,
    removerFaixa,
    salvarTarifa,
    cancelarEdicaoTarifa,
    tarifaSalvaComSucessoId,
    resumo,
  } = usePerfisTarifas();

  const sheetPerfilAberto = dadosPerfilEditando !== null;

  return (
    <SidebarMain>
      <main className="px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-5">
          <header
            className={cn(
              sectionPanelClass,
              'relative overflow-hidden px-5 py-5 md:px-6',
            )}
          >
            <div
              className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/5 blur-2xl"
              aria-hidden
            />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/15">
                  <Settings2 className="size-5 text-primary" aria-hidden />
                </div>
                <div>
                  <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-primary md:text-headline-lg">
                    Perfis & Tarifas
                  </h1>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    Gerencie perfis de veículo e tarifas por faixa de km em um
                    único lugar.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-surface-highest px-3 py-1 text-[10px] font-semibold text-muted-foreground ring-1 ring-inset ring-outline-variant/50">
                {tipoCargaFiltro
                  ? TIPO_CARGA_LABELS[tipoCargaFiltro]
                  : 'Todos os tipos'}
              </span>
            </div>
          </header>

          <div
            className={cn(
              'sticky top-0 z-20 flex justify-end',
              sectionPanelClass,
              'p-1.5',
            )}
          >
            <div
              className="flex w-full gap-1 sm:max-w-md"
              role="group"
              aria-label="Filtrar por tipo de carga"
            >
              {FILTROS_CARGA.map(({ id, label, icon: Icon }) => {
                const ativo = tipoCargaFiltro === id;

                return (
                  <button
                    key={id ?? 'todos'}
                    type="button"
                    onClick={() => setTipoCargaFiltro(id)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2',
                      'text-[11px] font-medium transition-all sm:text-xs',
                      ativo
                        ? id === 'refrigerado'
                          ? 'bg-secondary text-secondary-foreground shadow-sm'
                          : id === 'seco'
                            ? 'bg-tertiary text-tertiary-foreground shadow-sm'
                            : 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-surface-highest hover:text-foreground',
                    )}
                    aria-pressed={ativo}
                  >
                    <Icon className="size-3.5 shrink-0" aria-hidden />
                    <span className="hidden min-[400px]:inline">{label}</span>
                    <span className="min-[400px]:hidden">
                      {id === null ? 'Todos' : id === 'seco' ? 'Seco' : 'Refri.'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <PerfisTarifasSummary
            totalPerfis={perfisFiltrados.length}
            menorTarifaInicio={resumo.menorTarifaInicio}
            maiorTarifa={resumo.maiorTarifa}
            totalFaixas={resumo.totalFaixas}
            tipoCargaFiltro={tipoCargaFiltro}
          />

          {!unidadeId ? (
            <div className="rounded-xl border border-outline-variant/60 bg-surface-low px-4 py-8 text-center text-sm text-muted-foreground">
              Selecione uma unidade para gerenciar perfis e tarifas.
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant/60 bg-surface-low px-4 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Carregando perfis...
            </div>
          ) : (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Perfis de veículo
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Capacidade, integração Ravex e tarifas por km em cada card
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-surface-highest px-3 py-1 text-[10px] font-semibold text-muted-foreground ring-1 ring-inset ring-outline-variant/50">
                    {perfisFiltrados.length} perfis
                    {tipoCargaFiltro
                      ? ` · ${TIPO_CARGA_LABELS[tipoCargaFiltro]}`
                      : ''}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-2 text-xs"
                    onClick={abrirCriarPerfil}
                  >
                    <Plus className="size-3.5" aria-hidden />
                    Novo perfil
                  </Button>
                </div>
              </div>

              {perfisFiltrados.length === 0 ? (
                <div className="rounded-xl border border-dashed border-outline-variant/60 px-4 py-10 text-center text-sm text-muted-foreground">
                  {tipoCargaFiltro
                    ? `Nenhum perfil cadastrado para ${TIPO_CARGA_LABELS[tipoCargaFiltro].toLowerCase()}.`
                    : 'Nenhum perfil cadastrado.'}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {perfisFiltrados.map((perfil) => (
                    <PerfilCard
                      key={perfil.id}
                      perfil={perfil}
                      onEditar={() => abrirEdicaoPerfil(perfil)}
                      editandoTarifa={tarifaEditandoId === perfil.id}
                      salvaTarifaComSucesso={tarifaSalvaComSucessoId === perfil.id}
                      faixasEditando={faixasEditando}
                      proporcaoMax={resumo.proporcaoMax}
                      onIniciarEdicaoTarifa={() => iniciarEdicaoTarifa(perfil)}
                      onSalvarTarifa={salvarTarifa}
                      onCancelarEdicaoTarifa={cancelarEdicaoTarifa}
                      onAdicionarFaixa={adicionarFaixa}
                      onRemoverFaixa={removerFaixa}
                      onAtualizarFaixa={atualizarFaixa}
                      isSubmitting={isSubmitting}
                    />
                  ))}
                </div>
              )}

              <div
                className={cn(
                  'flex items-start gap-3 rounded-xl border border-primary/15',
                  'bg-primary/5 px-4 py-3',
                )}
              >
                <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {tipoCargaFiltro ? (
                    <>
                      Exibindo perfis de{' '}
                      <strong className="text-foreground">
                        {TIPO_CARGA_LABELS[tipoCargaFiltro].toLowerCase()}
                      </strong>
                      .{' '}
                    </>
                  ) : null}
                  Configure as tarifas diretamente em cada card. Deixe o km final
                  em branco para representar &quot;acima de X km&quot;. Maior
                  tarifa atual:{' '}
                  <strong className="text-foreground">
                    {formatarMoeda(resumo.maiorTarifa)}
                  </strong>
                  .
                </p>
              </div>
            </section>
          )}
        </div>
      </main>

      <PerfilTarifaFormDialog
        open={perfilFormDialog.open}
        tipoCargaPadrao={tipoCargaFiltro ?? 'seco'}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            fecharPerfilFormDialog();
          }
        }}
        onSubmit={salvarNovoPerfil}
      />

      <Sheet
        open={sheetPerfilAberto}
        onOpenChange={(aberto) => {
          if (!aberto) cancelarEdicaoPerfil();
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        >
          <SheetHeader className="shrink-0 border-b border-outline-variant bg-surface-highest/30 px-6 py-5 text-left">
            <SheetTitle className="flex items-center gap-2 text-foreground">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Truck className="size-4 text-primary" aria-hidden />
              </div>
              Editar perfil
            </SheetTitle>
            <SheetDescription asChild>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {dadosPerfilEditando ? (
                  <>
                    <span className="text-sm font-medium text-foreground">
                      {dadosPerfilEditando.nome}
                    </span>
                    <TipoCargaBadge tipoCarga={dadosPerfilEditando.tipoCarga} />
                  </>
                ) : null}
              </div>
            </SheetDescription>
          </SheetHeader>

          {dadosPerfilEditando ? (
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Identificação
                </p>
                <div className="space-y-1.5">
                  <label
                    htmlFor="perfil-nome"
                    className="text-xs font-medium text-foreground"
                  >
                    Nome
                  </label>
                  <input
                    id="perfil-nome"
                    type="text"
                    value={dadosPerfilEditando.nome}
                    onChange={(event) =>
                      atualizarCampoPerfil('nome', event.target.value)
                    }
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="perfil-tipo-carga" className="text-xs font-medium text-foreground">
                    Tipo de carga
                  </label>
                  <select
                    id="perfil-tipo-carga"
                    className={inputClass}
                    value={dadosPerfilEditando.tipoCarga}
                    onChange={(event) =>
                      atualizarCampoPerfil(
                        'tipoCarga',
                        event.target.value as TipoCarga,
                      )
                    }
                  >
                    {(Object.keys(TIPO_CARGA_LABELS) as TipoCarga[]).map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {TIPO_CARGA_LABELS[tipo]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Capacidade máxima
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="perfil-peso"
                      className="flex items-center gap-1 text-xs font-medium text-foreground"
                    >
                      <Scale className="size-3 text-muted-foreground" aria-hidden />
                      Peso (kg)
                    </label>
                    <input
                      id="perfil-peso"
                      type="number"
                      min={1}
                      value={dadosPerfilEditando.peso}
                      onChange={(event) =>
                        atualizarCampoPerfil(
                          'peso',
                          Number.parseFloat(event.target.value) || 0,
                        )
                      }
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="perfil-cubagem"
                      className="flex items-center gap-1 text-xs font-medium text-foreground"
                    >
                      <Package className="size-3 text-muted-foreground" aria-hidden />
                      Cubagem (m³)
                    </label>
                    <input
                      id="perfil-cubagem"
                      type="number"
                      min={0}
                      step={0.1}
                      value={dadosPerfilEditando.cubagem ?? ''}
                      onChange={(event) =>
                        atualizarCampoPerfil(
                          'cubagem',
                          event.target.value === ''
                            ? null
                            : Number.parseFloat(event.target.value) || 0,
                        )
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Descrição
                </p>
                <textarea
                  id="perfil-descricao"
                  rows={4}
                  value={dadosPerfilEditando.descricao ?? ''}
                  onChange={(event) =>
                    atualizarCampoPerfil('descricao', event.target.value)
                  }
                  placeholder="Descreva o uso recomendado deste perfil..."
                  className={cn(inputClass, 'resize-none')}
                />
              </div>
            </div>
          ) : null}

          <SheetFooter className="shrink-0 flex-row gap-2 border-t border-outline-variant bg-surface-highest/20 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={cancelarEdicaoPerfil}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1 gap-2"
              onClick={() => void salvarPerfil()}
              disabled={!dadosPerfilEditando || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Check className="size-4" aria-hidden />
              )}
              Salvar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </SidebarMain>
  );
}
