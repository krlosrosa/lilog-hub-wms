'use client';

import {
  ArrowLeft,
  CircleHelp,
  FileText,
  Info,
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
  sectionCardClassName,
} from '@/features/inventario/components/form-field-classes';
import { useInventarioNovaDemanda } from '@/features/inventario/hooks/use-inventario-nova-demanda';
import {
  DEMANDA_PRIORIDADE_LABELS,
  type DemandaContagemTipo,
  type DemandaPrioridade,
} from '@/features/inventario/types/inventario-lista.schema';

const chipPrimaryClassName =
  'inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary';

const chipSecondaryClassName =
  'inline-flex items-center gap-1 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-[10px] font-bold text-secondary';

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
    filtroCategoria,
    setFiltroCategoria,
    filtroEndereco,
    setFiltroEndereco,
    enderecoIdsSelecionados,
    categoriasSelecionadas,
    responsavelSelecionado,
    enderecosFiltrados,
    zonasDisponiveis,
    categoriasFiltradas,
    toggleEndereco,
    selecionarTodosFiltrados,
    limparEnderecos,
    selecionarPorZona,
    adicionarCategoria,
    removerCategoria,
    voltarLista,
    confirmarConfiguracao,
    opcoesResponsavel,
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
    <SidebarMain>
      <main className="flex-1 px-margin-mobile py-8 md:px-margin-desktop md:pb-12">
        <div className="mx-auto flex max-w-container flex-col gap-6 md:gap-8">
          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={voltarLista}
                className="rounded-full p-2 transition-colors hover:bg-surface-high"
                aria-label="Voltar para demandas"
              >
                <ArrowLeft className="size-5 text-muted-foreground" aria-hidden />
              </button>
              <div>
                <h1 className="text-headline-lg-mobile font-semibold tracking-tight text-primary md:text-headline-lg">
                  Configurar Demanda de Inventário
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Criação de nova ordem de contagem cíclica
                </p>
              </div>
            </div>
            <Button
              type="submit"
              form="form-nova-demanda"
              disabled={salvando}
              className="gap-2 self-start sm:self-auto"
            >
              <Save className="size-4 shrink-0" aria-hidden />
              {salvando ? 'Salvando…' : 'Salvar Alterações'}
            </Button>
          </header>

          <form
            id="form-nova-demanda"
            noValidate
            className="grid grid-cols-12 gap-4 md:gap-6"
            onSubmit={confirmarConfiguracao}
          >
            <section className={cn(sectionCardClassName, 'col-span-12 lg:col-span-7')}>
              <header className="mb-6 flex items-center gap-2">
                <Info className="size-6 shrink-0 text-primary" aria-hidden />
                <h2 className="text-headline-md font-medium text-foreground">
                  Informações Básicas
                </h2>
              </header>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="demanda-nome" className={fieldLabelClassName}>
                    Nome / ID da Demanda
                  </label>
                  <input
                    id="demanda-nome"
                    aria-invalid={Boolean(errors.nome)}
                    className={cn(fieldInputClassName, 'mt-2 rounded-xl')}
                    {...form.register('nome')}
                  />
                  {errors.nome?.message ? (
                    <p role="alert" className={fieldErrorClassName}>
                      {errors.nome.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="demanda-prioridade" className={fieldLabelClassName}>
                    Prioridade
                  </label>
                  <select
                    id="demanda-prioridade"
                    className={cn(fieldInputClassName, 'mt-2 appearance-none rounded-xl')}
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

                <div className="flex flex-col justify-end">
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-xl border border-outline-variant bg-surface-high p-3 transition-colors',
                      statusAtivo && 'border-primary/50',
                    )}
                  >
                    <span className="text-label-md font-medium text-foreground">
                      Status Ativo
                    </span>
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
                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors',
                        statusAtivo ? 'bg-tertiary-container' : 'bg-surface-variant',
                      )}
                    >
                      <span className="sr-only">Status ativo</span>
                      <span
                        className={cn(
                          'absolute left-0.5 top-0.5 size-5 rounded-full bg-foreground shadow transition-transform',
                          statusAtivo && 'translate-x-5',
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className={cn(sectionCardClassName, 'col-span-12 lg:col-span-5')}>
              <header className="mb-6 flex items-center gap-2">
                <Workflow className="size-6 shrink-0 text-primary" aria-hidden />
                <h2 className="text-headline-md font-medium text-foreground">
                  Método de Contagem
                </h2>
              </header>

              <div className="space-y-4">
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors hover:bg-surface-high',
                    tipo === 'cega'
                      ? 'border-primary/30 bg-surface-low'
                      : 'border-outline-variant bg-surface-low',
                  )}
                >
                  <input
                    type="radio"
                    name="metodo-contagem"
                    checked={tipo === 'cega'}
                    onChange={() => setTipo('cega')}
                    className="mt-0.5 size-5 shrink-0 accent-primary"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-bold',
                          tipo === 'cega' ? 'text-primary' : 'text-foreground',
                        )}
                      >
                        Contagem Cega
                      </span>
                      <span title="Operadores não vêem o saldo atual no sistema.">
                        <CircleHelp
                          className="size-3.5 text-muted-foreground"
                          aria-hidden
                        />
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Prioriza precisão máxima e evita viés de confirmação.
                    </p>
                  </div>
                </label>

                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors hover:bg-surface-high',
                    tipo === 'validacao'
                      ? 'border-primary/30 bg-surface-low'
                      : 'border-outline-variant bg-surface-low',
                  )}
                >
                  <input
                    type="radio"
                    name="metodo-contagem"
                    checked={tipo === 'validacao'}
                    onChange={() => setTipo('validacao')}
                    className="mt-0.5 size-5 shrink-0 accent-primary"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-bold',
                          tipo === 'validacao' ? 'text-primary' : 'text-foreground',
                        )}
                      >
                        Validação Direta
                      </span>
                      <span title="Operadores confirmam o saldo pré-existente.">
                        <CircleHelp
                          className="size-3.5 text-muted-foreground"
                          aria-hidden
                        />
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Ideal para conferências rápidas em áreas de alto giro.
                    </p>
                  </div>
                </label>
              </div>
            </section>

            <section className={cn(sectionCardClassName, 'col-span-12 lg:col-span-8')}>
              <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="size-6 shrink-0 text-primary" aria-hidden />
                  <h2 className="text-headline-md font-medium text-foreground">
                    Endereços de contagem
                  </h2>
                </div>
                <span className="text-sm text-muted-foreground">
                  {enderecoIdsSelecionados.length} selecionado(s)
                </span>
              </header>

              <div className="mb-4 flex flex-wrap gap-2">
                {zonasDisponiveis.map((zona) => (
                  <button
                    key={zona}
                    type="button"
                    className="rounded-full border border-outline-variant px-3 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    onClick={() => selecionarPorZona(zona)}
                  >
                    + Zona {zona}
                  </button>
                ))}
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px] flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    type="search"
                    placeholder="Buscar endereço ou zona..."
                    value={filtroEndereco}
                    onChange={(e) => setFiltroEndereco(e.target.value)}
                    className={cn(fieldInputClassName, 'rounded-xl pl-9 text-sm')}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selecionarTodosFiltrados}
                  disabled={carregandoEnderecos || enderecosFiltrados.length === 0}
                >
                  Selecionar filtrados
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={limparEnderecos}
                  disabled={enderecoIdsSelecionados.length === 0}
                >
                  Limpar
                </Button>
              </div>

              <div className="mb-6 max-h-72 overflow-y-auto rounded-xl border border-outline-variant bg-surface-low">
                {carregandoEnderecos ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    Carregando endereços do centro...
                  </p>
                ) : erroEnderecos ? (
                  <p role="alert" className="p-4 text-sm text-destructive">
                    {erroEnderecos}
                  </p>
                ) : enderecosFiltrados.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    Nenhum endereço cadastrado para o centro deste inventário.
                    Cadastre endereços em Operacional &gt; Endereços ou execute{' '}
                    <code className="rounded bg-surface-high px-1 py-0.5 text-xs">
                      pnpm --filter api db:seed
                    </code>{' '}
                    em desenvolvimento.
                  </p>
                ) : (
                  <ul className="divide-y divide-outline-variant">
                    {enderecosFiltrados.map((endereco) => {
                      const checked = enderecoIdsSelecionados.includes(endereco.id);
                      return (
                        <li key={endereco.id}>
                          <label className="flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-surface-high">
                            <input
                              type="checkbox"
                              className="mt-1 size-4 accent-primary"
                              checked={checked}
                              onChange={() => toggleEndereco(endereco.id)}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block font-mono text-sm font-semibold text-foreground">
                                {endereco.enderecoMascarado}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Zona: {endereco.zona}
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
                <p role="alert" className={cn(fieldErrorClassName, 'mb-4')}>
                  {errors.enderecoIds.message}
                </p>
              ) : null}

              <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <span className={fieldLabelClassName}>
                    Intervalo de Racks (opcional)
                  </span>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      placeholder="Início (ex: R01)"
                      className={cn(fieldInputClassName, 'rounded-xl text-sm')}
                      {...form.register('rackInicio')}
                    />
                    <span className="shrink-0 text-muted-foreground">até</span>
                    <input
                      placeholder="Fim (ex: R10)"
                      className={cn(fieldInputClassName, 'rounded-xl text-sm')}
                      {...form.register('rackFim')}
                    />
                  </div>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-6 border-t border-outline-variant pt-6 sm:grid-cols-2">
                <div>
                  <span className={fieldLabelClassName}>Categoria de Produto</span>
                  <div className="mt-2 flex min-h-[50px] flex-wrap gap-2 rounded-xl border border-outline-variant bg-surface-low p-3">
                    {categoriasSelecionadas.map((cat) => (
                      <span key={cat} className={chipSecondaryClassName}>
                        {cat}
                        <button
                          type="button"
                          className="hover:text-foreground"
                          aria-label={`Remover ${cat}`}
                          onClick={() => removerCategoria(cat)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      value={filtroCategoria}
                      onChange={(e) => setFiltroCategoria(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && categoriasFiltradas[0]) {
                          e.preventDefault();
                          adicionarCategoria(categoriasFiltradas[0]);
                        }
                      }}
                      placeholder="Filtrar categorias..."
                      className="min-w-[80px] flex-1 border-none bg-transparent text-[10px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                    />
                  </div>
                  {filtroCategoria && categoriasFiltradas.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {categoriasFiltradas.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          className="rounded-full border border-outline-variant px-2 py-0.5 text-[10px] text-muted-foreground hover:border-secondary hover:text-secondary"
                          onClick={() => adicionarCategoria(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="demanda-sku" className={fieldLabelClassName}>
                    Itens Específicos (SKU)
                  </label>
                  <div className="relative mt-2">
                    <Search
                      className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <input
                      id="demanda-sku"
                      placeholder="Buscar por SKU ou Nome do Produto..."
                      className={cn(fieldInputClassName, 'rounded-xl pl-11 text-sm')}
                      {...form.register('skuBusca')}
                    />
                  </div>
                </div>
              </div>

              <div className="relative h-48 w-full overflow-hidden rounded-xl border border-outline-variant opacity-50 grayscale">
                <div className="absolute inset-0 bg-gradient-to-br from-surface-high via-surface-low to-surface-high" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="absolute inset-0 flex items-end p-4">
                  <span className="rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-on-primary-container">
                    Mapa Ativo: Galpão Principal
                  </span>
                </div>
              </div>
            </section>

            <section
              className={cn(sectionCardClassName, 'col-span-12 h-fit lg:col-span-4')}
            >
              <header className="mb-6 flex items-center gap-2">
                <Users className="size-6 shrink-0 text-primary" aria-hidden />
                <h2 className="text-headline-md font-medium text-foreground">
                  Equipe e Responsáveis
                </h2>
              </header>

              <div>
                <label htmlFor="demanda-responsavel" className={fieldLabelClassName}>
                  Responsável Geral
                </label>
                <select
                  id="demanda-responsavel"
                  aria-invalid={Boolean(errors.responsavelId)}
                  className="sr-only"
                  {...form.register('responsavelId')}
                >
                  <option value="">Selecione um responsável</option>
                  {opcoesResponsavel.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>

                {responsavelSelecionado ? (
                  <div className="mt-2 flex items-center gap-4 rounded-xl border border-primary/20 bg-surface-high p-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card text-sm font-bold uppercase text-muted-foreground">
                      {responsavelSelecionado.label.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground">
                        {responsavelSelecionado.label.split(' (')[0]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {responsavelSelecionado.label.match(/\(([^)]+)\)/)?.[1] ??
                          'Operações'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 rounded-xl border border-outline-variant bg-surface-low p-4">
                    <p className="mb-3 text-sm text-muted-foreground">
                      Selecione o responsável pela contagem
                    </p>
                    <div className="flex flex-col gap-2">
                      {opcoesResponsavel.map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          className="rounded-lg border border-outline-variant px-3 py-2 text-left text-sm transition-colors hover:border-primary hover:bg-surface-high"
                          onClick={() =>
                            void form.setValue('responsavelId', r.value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {errors.responsavelId?.message ? (
                  <p role="alert" className={fieldErrorClassName}>
                    {errors.responsavelId.message}
                  </p>
                ) : null}
              </div>
            </section>

            <section className={cn(sectionCardClassName, 'col-span-12')}>
              <header className="mb-6 flex items-center gap-2">
                <FileText className="size-6 shrink-0 text-primary" aria-hidden />
                <h2 className="text-headline-md font-medium text-foreground">
                  Observações e Instruções
                </h2>
              </header>

              <textarea
                rows={4}
                placeholder="Insira aqui instruções especiais de manuseio, cuidados com produtos frágeis ou observações para a equipe..."
                className={cn(
                  fieldInputClassName,
                  'resize-none rounded-xl',
                )}
                {...form.register('observacoes')}
              />

              <div className="mt-4 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() =>
                    void form.setValue('alertaFragilidade', !alertaFragilidade, {
                      shouldDirty: true,
                    })
                  }
                  className={cn(
                    'flex items-center gap-2 text-xs transition-colors',
                    alertaFragilidade
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <ShieldAlert className="size-4 shrink-0" aria-hidden />
                  Ativar alerta de fragilidade para SKU eletrônico
                </button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Timer className="size-4 shrink-0" aria-hidden />
                  Estimativa de conclusão: 4h 30min
                </div>
              </div>
            </section>
          </form>

          <footer className="flex flex-wrap justify-end gap-3 border-t border-outline-variant/30 pt-6">
            <Button type="button" variant="outline" onClick={voltarLista}>
              Descartar
            </Button>
            <Button
              type="submit"
              form="form-nova-demanda"
              disabled={salvando}
            >
              {salvando ? 'Salvando…' : 'Confirmar Configuração'}
            </Button>
          </footer>
        </div>
      </main>
    </SidebarMain>
  );
}
