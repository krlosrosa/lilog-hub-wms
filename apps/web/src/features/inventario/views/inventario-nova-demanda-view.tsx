'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';

import {
  CircleHelp,
  FileText,
  Info,
  Loader2,
  MapPin,
  Save,
  Search,
  ShieldAlert,
  Timer,
  Users,
  Workflow,
} from 'lucide-react';

import { Button, cn } from '@lilog/ui';

import { SidebarMain } from '@/components/layout/sidebar';

import {
  fieldErrorClassName,
  fieldInputClassName,
  fieldLabelClassName,
} from '@/features/inventario/components/form-field-classes';
import {
  ENDERECO_TIPO_LABELS,
} from '@/features/enderecos/types/enderecos-gestao.schema';
import { useInventarioNovaDemanda } from '@/features/inventario/hooks/use-inventario-nova-demanda';
import {
  DEMANDA_PRIORIDADE_LABELS,
  type DemandaContagemTipo,
  type DemandaPrioridade,
} from '@/features/inventario/types/inventario-lista.schema';

const compactInputClassName = cn(
  fieldInputClassName,
  'rounded-lg px-3 py-2 text-xs',
);

const cardClassName =
  'rounded-lg border border-outline-variant bg-card p-3 shadow-inner-glow transition-colors hover:border-primary/25 md:p-4';

const filterChipClassName = (active: boolean) =>
  cn(
    'rounded-full border px-2 py-px text-[9px] font-medium transition-colors',
    active
      ? 'border-primary bg-primary/10 text-primary'
      : 'border-outline-variant text-muted-foreground hover:border-primary hover:text-primary',
  );

function FilterChipRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="w-10 shrink-0 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap gap-1">{children}</div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-3 flex items-start justify-between gap-2 border-b border-outline-variant pb-2">
      <div className="flex min-w-0 items-start gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <h2 className="text-[11px] font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="text-[10px] text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {action}
    </header>
  );
}

const METODO_HINTS: Record<DemandaContagemTipo, string> = {
  cega: 'Operadores não veem o saldo atual — evita viés de confirmação.',
  validacao: 'Confirmação do saldo existente — ideal para áreas de alto giro.',
};

export type InventarioNovaDemandaViewProps = {
  inventarioId: string;
};

export function InventarioNovaDemandaView({
  inventarioId,
}: InventarioNovaDemandaViewProps) {
  const {
    form,
    salvando,
    carregandoEnderecos,
    erroEnderecos,
    filtroEndereco,
    setFiltroEndereco,
    filtroZonas,
    filtroNiveis,
    filtroRuas,
    filtroRuaTexto,
    setFiltroRuaTexto,
    filtroTipos,
    filtroGrupos,
    temFiltrosAtivos,
    enderecoIdsSelecionados,
    enderecosFiltrados,
    zonasDisponiveis,
    niveisDisponiveis,
    ruasDisponiveis,
    tiposDisponiveis,
    gruposDisponiveis,
    toggleEndereco,
    selecionarTodosFiltrados,
    limparEnderecos,
    toggleFiltroZona,
    toggleFiltroNivel,
    toggleFiltroRua,
    toggleFiltroTipo,
    toggleFiltroGrupo,
    limparFiltros,
    voltarLista,
    confirmarConfiguracao,
    opcoesResponsavel,
    filtrandoSku,
    skuFiltroAtivo,
  } = useInventarioNovaDemanda(inventarioId);

  const tipo = form.watch('tipo');
  const statusAtivo = form.watch('statusAtivo');
  const alertaFragilidade = form.watch('alertaFragilidade');
  const { errors } = form.formState;

  const setTipo = (next: DemandaContagemTipo) => {
    void form.setValue('tipo', next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <SidebarMain className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant bg-glass-bg px-margin-mobile py-2.5 backdrop-blur-glass md:px-margin-desktop">
        <div className="min-w-0 flex-col gap-0.5">
          <nav
            aria-label="Migalhas"
            className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground"
          >
            <Link href="/inventario" className="transition-colors hover:text-primary">
              Inventário
            </Link>
            <span aria-hidden>/</span>
            <Link
              href={`/inventario/${inventarioId}`}
              className="transition-colors hover:text-primary"
            >
              Detalhe
            </Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-foreground">Nova demanda</span>
          </nav>
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
            Configurar demanda
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-outline-variant text-xs"
            onClick={voltarLista}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-nova-demanda"
            disabled={salvando}
            size="sm"
            className="h-8 gap-1.5"
          >
            {salvando ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Salvando…
              </>
            ) : (
              <>
                <Save className="size-3.5 shrink-0" aria-hidden />
                <span className="hidden sm:inline">Confirmar</span>
                <span className="sm:hidden">Salvar</span>
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="flex-1 bg-surface-lowest px-margin-mobile py-3 md:px-margin-desktop md:py-4">
        <div className="mx-auto max-w-5xl">
          <form
            id="form-nova-demanda"
            noValidate
            className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4"
            onSubmit={confirmarConfiguracao}
          >
            <section className={cn(cardClassName, 'lg:col-span-7')}>
              <SectionHeader
                icon={<Info className="size-3.5" aria-hidden />}
                title="Informações básicas"
                description="Identificação e prioridade da ordem"
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label htmlFor="demanda-nome" className={fieldLabelClassName}>
                    Nome / ID da demanda
                  </label>
                  <input
                    id="demanda-nome"
                    aria-invalid={Boolean(errors.nome)}
                    className={compactInputClassName}
                    {...form.register('nome')}
                  />
                  {errors.nome?.message ? (
                    <p role="alert" className={fieldErrorClassName}>
                      {errors.nome.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="demanda-prioridade" className={fieldLabelClassName}>
                    Prioridade
                  </label>
                  <select
                    id="demanda-prioridade"
                    className={cn(compactInputClassName, 'appearance-none')}
                    {...form.register('prioridade')}
                  >
                    {(Object.keys(DEMANDA_PRIORIDADE_LABELS) as DemandaPrioridade[]).map(
                      (key) => (
                        <option key={key} value={key}>
                          {DEMANDA_PRIORIDADE_LABELS[key]}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="flex flex-col justify-end gap-1">
                  <span className={fieldLabelClassName}>Status</span>
                  <div
                    className={cn(
                      'flex h-[34px] items-center justify-between rounded-lg border border-outline-variant bg-surface-low px-3 transition-colors',
                      statusAtivo && 'border-primary/40',
                    )}
                  >
                    <span className="text-xs font-medium text-foreground">Ativo</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={statusAtivo}
                      onClick={() =>
                        void form.setValue('statusAtivo', !statusAtivo, {
                          shouldDirty: true,
                        })
                      }
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors',
                        statusAtivo ? 'bg-primary' : 'bg-muted',
                      )}
                    >
                      <span className="sr-only">Status ativo</span>
                      <span
                        className={cn(
                          'absolute left-0.5 top-0.5 size-4 rounded-full bg-background shadow transition-transform',
                          statusAtivo && 'translate-x-4',
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className={cn(cardClassName, 'lg:col-span-5')}>
              <SectionHeader
                icon={<Workflow className="size-3.5" aria-hidden />}
                title="Método de contagem"
              />

              <input type="hidden" {...form.register('tipo')} />
              <div
                className="inline-flex w-full gap-1 rounded-lg border border-outline-variant bg-surface-low p-0.5"
                role="group"
                aria-label="Método de contagem"
              >
                <Button
                  type="button"
                  size="sm"
                  variant={tipo === 'cega' ? 'default' : 'ghost'}
                  className="h-7 flex-1 gap-1 text-[10px]"
                  onClick={() => setTipo('cega')}
                >
                  Contagem cega
                  <span title="Operadores não veem o saldo atual no sistema.">
                    <CircleHelp className="size-3 text-muted-foreground" aria-hidden />
                  </span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={tipo === 'validacao' ? 'default' : 'ghost'}
                  className="h-7 flex-1 gap-1 text-[10px]"
                  onClick={() => setTipo('validacao')}
                >
                  Validação
                  <span title="Operadores confirmam o saldo pré-existente.">
                    <CircleHelp className="size-3 text-muted-foreground" aria-hidden />
                  </span>
                </Button>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                {METODO_HINTS[tipo]}
              </p>
            </section>

            <section className={cn(cardClassName, 'lg:col-span-8')}>
              <SectionHeader
                icon={<MapPin className="size-3.5" aria-hidden />}
                title="Endereços de contagem"
                description="Selecione os locais a contar"
                action={
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-px text-[10px] font-semibold tabular-nums text-primary">
                    {enderecoIdsSelecionados.length} sel.
                  </span>
                }
              />

              <div className="mb-3 space-y-1.5 rounded-lg border border-outline-variant bg-surface-low p-2">
                {zonasDisponiveis.length > 0 ? (
                  <FilterChipRow label="Zona">
                    {zonasDisponiveis.map((zona) => (
                      <button
                        key={zona}
                        type="button"
                        className={filterChipClassName(filtroZonas.includes(zona))}
                        onClick={() => toggleFiltroZona(zona)}
                      >
                        {zona}
                      </button>
                    ))}
                  </FilterChipRow>
                ) : null}

                {niveisDisponiveis.length > 0 ? (
                  <FilterChipRow label="Nível">
                    {niveisDisponiveis.map((nivel) => (
                      <button
                        key={nivel}
                        type="button"
                        className={filterChipClassName(filtroNiveis.includes(nivel))}
                        onClick={() => toggleFiltroNivel(nivel)}
                      >
                        {nivel}
                      </button>
                    ))}
                  </FilterChipRow>
                ) : null}

                {ruasDisponiveis.length > 0 && ruasDisponiveis.length <= 20 ? (
                  <FilterChipRow label="Rua">
                    {ruasDisponiveis.map((rua) => (
                      <button
                        key={rua}
                        type="button"
                        className={filterChipClassName(filtroRuas.includes(rua))}
                        onClick={() => toggleFiltroRua(rua)}
                      >
                        {rua}
                      </button>
                    ))}
                  </FilterChipRow>
                ) : ruasDisponiveis.length > 20 ? (
                  <FilterChipRow label="Rua">
                    <input
                      type="search"
                      placeholder="Filtrar por rua…"
                      value={filtroRuaTexto}
                      onChange={(e) => setFiltroRuaTexto(e.target.value)}
                      className={cn(compactInputClassName, 'max-w-[8rem]')}
                    />
                  </FilterChipRow>
                ) : null}

                {tiposDisponiveis.length > 0 ? (
                  <FilterChipRow label="Tipo">
                    {tiposDisponiveis.map((tipoEndereco) => (
                      <button
                        key={tipoEndereco}
                        type="button"
                        className={filterChipClassName(
                          filtroTipos.includes(tipoEndereco),
                        )}
                        onClick={() => toggleFiltroTipo(tipoEndereco)}
                      >
                        {ENDERECO_TIPO_LABELS[tipoEndereco]}
                      </button>
                    ))}
                  </FilterChipRow>
                ) : null}

                {gruposDisponiveis.length > 0 ? (
                  <FilterChipRow label="Grupo">
                    {gruposDisponiveis.map((grupo) => (
                      <button
                        key={grupo}
                        type="button"
                        className={filterChipClassName(
                          filtroGrupos.includes(grupo),
                        )}
                        onClick={() => toggleFiltroGrupo(grupo)}
                      >
                        {grupo}
                      </button>
                    ))}
                  </FilterChipRow>
                ) : null}
              </div>

              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <div className="relative min-w-0 flex-1 sm:max-w-xs">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    type="search"
                    placeholder="Buscar endereço ou zona…"
                    value={filtroEndereco}
                    onChange={(e) => setFiltroEndereco(e.target.value)}
                    className={cn(compactInputClassName, 'pl-8')}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 border-outline-variant px-2 text-[10px]"
                  onClick={selecionarTodosFiltrados}
                  disabled={carregandoEnderecos || enderecosFiltrados.length === 0}
                >
                  Todos
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px]"
                  onClick={limparEnderecos}
                  disabled={enderecoIdsSelecionados.length === 0}
                >
                  Limpar sel.
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px]"
                  onClick={limparFiltros}
                  disabled={!temFiltrosAtivos}
                >
                  Limpar filtros
                </Button>
              </div>

              <div className="max-h-52 overflow-y-auto rounded-lg border border-outline-variant bg-surface-low">
                {carregandoEnderecos ? (
                  <p className="flex items-center gap-2 p-3 text-[11px] text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Carregando endereços…
                  </p>
                ) : erroEnderecos ? (
                  <p role="alert" className="p-3 text-[11px] text-destructive">
                    {erroEnderecos}
                  </p>
                ) : enderecosFiltrados.length === 0 ? (
                  <p className="p-3 text-[11px] leading-relaxed text-muted-foreground">
                    {skuFiltroAtivo
                      ? 'Nenhum endereço possui saldo do SKU informado.'
                      : temFiltrosAtivos || filtroEndereco.trim()
                        ? 'Nenhum endereço corresponde aos filtros aplicados.'
                        : 'Nenhum endereço cadastrado para o centro deste inventário.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-outline-variant/50">
                    {enderecosFiltrados.map((endereco) => {
                      const checked = enderecoIdsSelecionados.includes(endereco.id);
                      return (
                        <li key={endereco.id}>
                          <label className="flex cursor-pointer items-center gap-2 px-2 py-1.5 transition-colors hover:bg-surface-highest/50">
                            <input
                              type="checkbox"
                              className="size-3.5 accent-primary"
                              checked={checked}
                              onChange={() => toggleEndereco(endereco.id)}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block font-mono text-[11px] font-semibold text-foreground">
                                {endereco.enderecoMascarado}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Zona {endereco.zona} · Rua {endereco.rua} · Nível{' '}
                                {endereco.nivel} · {ENDERECO_TIPO_LABELS[endereco.tipo]}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              {errors.enderecoIds?.message ? (
                <p role="alert" className={cn(fieldErrorClassName, 'mt-1.5')}>
                  {errors.enderecoIds.message}
                </p>
              ) : null}

              <div className="mt-3 grid grid-cols-1 gap-3 border-t border-outline-variant pt-3 sm:grid-cols-2">
                <div>
                  <span className={fieldLabelClassName}>
                    Intervalo de racks (opcional)
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <input
                      placeholder="Início"
                      className={compactInputClassName}
                      {...form.register('rackInicio')}
                    />
                    <span className="shrink-0 text-[10px] text-muted-foreground">até</span>
                    <input
                      placeholder="Fim"
                      className={compactInputClassName}
                      {...form.register('rackFim')}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="demanda-sku" className={fieldLabelClassName}>
                    SKU específico
                    {skuFiltroAtivo ? (
                      <span className="ml-1.5 font-normal text-primary">
                        (filtrando endereços com saldo)
                      </span>
                    ) : null}
                  </label>
                  <div className="relative mt-1">
                    {filtrandoSku ? (
                      <Loader2
                        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground"
                        aria-hidden
                      />
                    ) : (
                      <Search
                        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                      />
                    )}
                    <input
                      id="demanda-sku"
                      placeholder={
                        tipo === 'validacao'
                          ? 'Buscar SKU ou produto…'
                          : 'Opcional — sem filtro de saldo'
                      }
                      className={cn(compactInputClassName, 'pl-8')}
                      {...form.register('skuBusca')}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className={cn(cardClassName, 'h-fit lg:col-span-4')}>
              <SectionHeader
                icon={<Users className="size-3.5" aria-hidden />}
                title="Responsável"
                description="Operador principal da contagem"
              />

              <div className="flex flex-col gap-1">
                <label htmlFor="demanda-responsavel" className={fieldLabelClassName}>
                  Responsável geral
                </label>
                <select
                  id="demanda-responsavel"
                  aria-invalid={Boolean(errors.responsavelId)}
                  className={cn(compactInputClassName, 'appearance-none')}
                  {...form.register('responsavelId')}
                >
                  <option value="">Selecione um responsável</option>
                  {opcoesResponsavel.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {errors.responsavelId?.message ? (
                  <p role="alert" className={fieldErrorClassName}>
                    {errors.responsavelId.message}
                  </p>
                ) : null}
              </div>
            </section>

            <section className={cn(cardClassName, 'lg:col-span-12')}>
              <SectionHeader
                icon={<FileText className="size-3.5" aria-hidden />}
                title="Observações"
                description="Instruções para a equipe de contagem"
              />

              <textarea
                rows={3}
                placeholder="Instruções de manuseio, cuidados com frágeis ou observações…"
                className={cn(compactInputClassName, 'resize-none')}
                {...form.register('observacoes')}
              />

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    void form.setValue('alertaFragilidade', !alertaFragilidade, {
                      shouldDirty: true,
                    })
                  }
                  className={cn(
                    'inline-flex items-center gap-1.5 text-[10px] transition-colors',
                    alertaFragilidade
                      ? 'font-medium text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <ShieldAlert className="size-3.5 shrink-0" aria-hidden />
                  Alerta de fragilidade (SKU eletrônico)
                </button>
                <div className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Timer className="size-3.5 shrink-0" aria-hidden />
                  Estimativa: ~4h 30min
                </div>
              </div>
            </section>
          </form>
        </div>
      </main>
    </SidebarMain>
  );
}
