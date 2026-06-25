'use client';

import { useMemo, useState } from 'react';

import { cn } from '@lilog/ui';
import { Search } from 'lucide-react';

import type {
  TipoVeiculo,
  TransporteGrupo,
  Veiculo,
} from '@/features/transporte/types/transporte.schema';
import { TIPO_VEICULO_LABELS } from '@/features/transporte/types/transporte.schema';

const nf = new Intl.NumberFormat('pt-BR');

const TIPO_OPTIONS: { value: 'todos' | TipoVeiculo; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'VUC', label: 'VUC' },
  { value: 'Toco', label: 'Toco' },
  { value: 'Truck_3_4', label: '3/4' },
  { value: 'Carreta', label: 'Carreta' },
  { value: 'Bitrem', label: 'Bitrem' },
];

type FiltroRapidoPlaca = 'todas' | 'nao_alocadas' | 'alocadas';

const FILTRO_PLACA_OPTIONS: { value: FiltroRapidoPlaca; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'nao_alocadas', label: 'Disponíveis' },
  { value: 'alocadas', label: 'Alocadas' },
];

const filterChipClass = (ativo: boolean, variante: 'default' | 'tertiary' = 'default') =>
  cn(
    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors',
    ativo
      ? variante === 'tertiary'
        ? 'bg-tertiary/15 text-tertiary ring-1 ring-inset ring-tertiary/25'
        : 'bg-primary/15 text-primary ring-1 ring-inset ring-primary/25'
      : 'bg-surface-highest text-muted-foreground ring-1 ring-inset ring-outline-variant/50 hover:text-foreground',
  );

const filterInputClass = cn(
  'rounded-md border border-outline-variant bg-surface-low px-2 py-1',
  'text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
);

function placaTemPerfilTarifa(veiculo: Veiculo): boolean {
  return Boolean(veiculo.perfilTarifaId && veiculo.perfilTarifaNome?.trim());
}

function PlacaVeiculoCard({
  veiculo,
  rotaAlocada,
  transporteAlvo,
  selecionado,
  modo,
  modoTransportador = false,
  processando,
  onAcao,
}: {
  veiculo: Veiculo;
  rotaAlocada?: string;
  transporteAlvo: TransporteGrupo | null;
  selecionado?: boolean;
  modo: 'selecionar' | 'alocar';
  modoTransportador?: boolean;
  processando: boolean;
  onAcao: () => void;
}) {
  const ocupacaoPercentual =
    veiculo.capacidadePeso > 0
      ? Math.round((veiculo.pesoAlocado / veiculo.capacidadePeso) * 100)
      : 0;

  const semPerfilTarifa = !placaTemPerfilTarifa(veiculo);

  const alocadaEmOutraEntrega =
    !veiculo.disponivel &&
    veiculo.id !== transporteAlvo?.veiculoAlocado?.veiculoId;

  const interativoBase = modoTransportador
    ? true
    : modo === 'selecionar'
      ? veiculo.disponivel ||
        veiculo.id === transporteAlvo?.veiculoAlocado?.veiculoId
      : veiculo.disponivel && transporteAlvo !== null;

  const interativo = interativoBase && !semPerfilTarifa;
  const clicavel = interativo && !processando;

  const cardClass = cn(
    'rounded-lg border px-2.5 py-2 transition-all',
    semPerfilTarifa
      ? 'border-outline-variant/40 bg-surface-low/40 opacity-75'
      : selecionado
        ? 'border-primary bg-primary/10 ring-1 ring-inset ring-primary/30'
        : clicavel
          ? 'cursor-pointer border-primary/35 bg-primary/5 hover:border-primary hover:bg-primary/10'
          : veiculo.disponivel
            ? 'border-outline-variant/70 bg-surface-low'
            : 'border-outline-variant/40 bg-surface-low/50 opacity-90',
  );

  const conteudo = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-mono text-[11px] font-bold text-primary">
              {veiculo.placa}
            </p>
            {semPerfilTarifa ? (
              <span className="rounded bg-destructive/15 px-1 py-px text-[8px] font-bold uppercase text-destructive">
                Sem perfil
              </span>
            ) : (
              <span
                className={cn(
                  'rounded px-1 py-px text-[8px] font-bold uppercase',
                  veiculo.disponivel
                    ? 'bg-tertiary/15 text-tertiary'
                    : modoTransportador && alocadaEmOutraEntrega
                      ? 'bg-secondary/15 text-secondary'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {veiculo.disponivel
                  ? 'Livre'
                  : modoTransportador && rotaAlocada
                    ? veiculo.id === transporteAlvo?.veiculoAlocado?.veiculoId
                      ? 'Atual'
                      : 'Alocada'
                    : 'Uso'}
              </span>
            )}
          </div>
          <p className="truncate text-[10px] text-muted-foreground">
            {veiculo.modelo}
            {veiculo.ano > 0 ? ` · ${veiculo.ano}` : ''}
          </p>
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <span className="rounded bg-secondary-container/25 px-1.5 py-px text-[9px] font-bold text-secondary">
          {veiculo.perfilTarifaNome ?? TIPO_VEICULO_LABELS[veiculo.tipo]}
        </span>
        <span className="text-[9px] text-muted-foreground">
          {nf.format(veiculo.capacidadePeso)} kg · {veiculo.capacidadeVolume} m³
        </span>
      </div>

      <p className="mt-1 truncate text-[10px] text-foreground">
        <span className="font-medium">{veiculo.transportadora || '—'}</span>
        {veiculo.motorista ? (
          <span className="text-muted-foreground"> · {veiculo.motorista}</span>
        ) : null}
      </p>

      {!veiculo.disponivel && rotaAlocada && (
        <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
          {modoTransportador ? 'Entrega: ' : '→ '}
          {rotaAlocada}
        </p>
      )}

      {veiculo.capacidadePeso > 0 && (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-container">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                veiculo.disponivel
                  ? ocupacaoPercentual > 0
                    ? 'bg-secondary'
                    : 'bg-tertiary/70'
                  : 'bg-muted-foreground/60',
              )}
              style={{ width: `${Math.min(ocupacaoPercentual, 100)}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-[9px] text-muted-foreground">
            {ocupacaoPercentual}%
          </span>
        </div>
      )}

      {clicavel && modo === 'alocar' && (
        <p className="mt-1 text-center text-[9px] font-semibold text-primary/80">
          Clique para alocar
        </p>
      )}
      {selecionado && modo === 'selecionar' && (
        <p className="mt-1 text-center text-[9px] font-semibold text-primary">
          Placa selecionada
        </p>
      )}
    </>
  );

  if (clicavel) {
    return (
      <button
        type="button"
        onClick={onAcao}
        disabled={processando}
        className={cn(
          cardClass,
          'w-full text-left focus:outline-none focus:ring-2 focus:ring-ring',
        )}
      >
        {conteudo}
      </button>
    );
  }

  return <div className={cardClass}>{conteudo}</div>;
}

export type PlacasListaProps = {
  veiculos: Veiculo[];
  transportes: TransporteGrupo[];
  transporteAlvo: TransporteGrupo | null;
  veiculoSelecionadoId?: string;
  processando: boolean;
  modo?: 'selecionar' | 'alocar';
  /** Exibe toda a frota, permite selecionar placas já alocadas. */
  modoTransportador?: boolean;
  /** Lista completa de transportadoras para o filtro (independente das placas visíveis). */
  transportadorasOpcoes?: string[];
  compacto?: boolean;
  preencherAltura?: boolean;
  onSelecionarPlaca: (veiculoId: string) => void;
  className?: string;
};

export function PlacasLista({
  veiculos,
  transportes,
  transporteAlvo,
  veiculoSelecionadoId,
  processando,
  modo = 'selecionar',
  modoTransportador = false,
  transportadorasOpcoes,
  compacto = false,
  preencherAltura = false,
  onSelecionarPlaca,
  className,
}: PlacasListaProps) {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | TipoVeiculo>('todos');
  const [filtroTransportadora, setFiltroTransportadora] = useState('todas');
  const [apenasDisponiveis, setApenasDisponiveis] = useState(
    !modoTransportador,
  );
  const [filtroRapidoPlaca, setFiltroRapidoPlaca] =
    useState<FiltroRapidoPlaca>('todas');

  const placasDisponiveis = useMemo(
    () => veiculos.filter((veiculo) => veiculo.disponivel).length,
    [veiculos],
  );

  const placasAlocadas = useMemo(
    () => veiculos.filter((veiculo) => !veiculo.disponivel).length,
    [veiculos],
  );

  const transportadoras = useMemo(() => {
    if (transportadorasOpcoes?.length) {
      return [...transportadorasOpcoes].sort((a, b) => a.localeCompare(b));
    }

    return [
      ...new Set(
        veiculos.map((veiculo) => veiculo.transportadora).filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [transportadorasOpcoes, veiculos]);

  const transportePorVeiculo = useMemo(() => {
    const mapa = new Map<string, TransporteGrupo>();
    transportes.forEach((transporte) => {
      if (transporte.veiculoAlocado) {
        mapa.set(transporte.veiculoAlocado.veiculoId, transporte);
      }
    });
    return mapa;
  }, [transportes]);

  const veiculosFiltrados = useMemo(() => {
    let lista = [...veiculos];

    if (modoTransportador && filtroRapidoPlaca === 'nao_alocadas') {
      lista = lista.filter((veiculo) => veiculo.disponivel);
    }

    if (modoTransportador && filtroRapidoPlaca === 'alocadas') {
      lista = lista.filter((veiculo) => !veiculo.disponivel);
    }

    if (apenasDisponiveis && !modoTransportador) {
      lista = lista.filter(
        (veiculo) =>
          veiculo.disponivel ||
          veiculo.id === transporteAlvo?.veiculoAlocado?.veiculoId,
      );
    }

    if (filtroTipo !== 'todos') {
      lista = lista.filter((veiculo) => veiculo.tipo === filtroTipo);
    }

    if (filtroTransportadora !== 'todas') {
      lista = lista.filter(
        (veiculo) => veiculo.transportadora === filtroTransportadora,
      );
    }

    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      lista = lista.filter(
        (veiculo) =>
          veiculo.placa.toLowerCase().includes(termo) ||
          veiculo.motorista.toLowerCase().includes(termo) ||
          veiculo.modelo.toLowerCase().includes(termo) ||
          veiculo.transportadora.toLowerCase().includes(termo),
      );
    }

    return lista.sort((a, b) => {
      if (a.disponivel !== b.disponivel) {
        return a.disponivel ? -1 : 1;
      }
      return a.placa.localeCompare(b.placa);
    });
  }, [
    veiculos,
    apenasDisponiveis,
    filtroTipo,
    filtroTransportadora,
    busca,
    transporteAlvo,
    modoTransportador,
    filtroRapidoPlaca,
  ]);

  return (
    <div
      className={cn(
        'space-y-2',
        preencherAltura && 'flex min-h-0 flex-1 flex-col',
        className,
      )}
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar placa, transportadora ou motorista..."
          className={cn(
            filterInputClass,
            'w-full py-1.5 pl-7 pr-2 placeholder:text-muted-foreground/50',
          )}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {!modoTransportador && (
          <select
            value={filtroTransportadora}
            onChange={(event) => setFiltroTransportadora(event.target.value)}
            aria-label="Filtrar por transportadora"
            className={cn(filterInputClass, 'min-w-0 flex-1')}
          >
            <option value="todas">Todas transportadoras</option>
            {transportadoras.map((transportadora) => (
              <option key={transportadora} value={transportadora}>
                {transportadora}
              </option>
            ))}
          </select>
        )}

        <select
          value={filtroTipo}
          onChange={(event) =>
            setFiltroTipo(event.target.value as 'todos' | TipoVeiculo)
          }
          aria-label="Filtrar por tipo de veículo"
          className={cn(filterInputClass, 'w-[72px]')}
        >
          {TIPO_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {!modoTransportador && (
          <label className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
            <input
              type="checkbox"
              checked={apenasDisponiveis}
              onChange={(event) => setApenasDisponiveis(event.target.checked)}
              className="size-3 rounded border-input accent-primary"
            />
            Livres
          </label>
        )}
      </div>

      {modoTransportador && (
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTRO_PLACA_OPTIONS.map((opcao) => (
            <button
              key={opcao.value}
              type="button"
              onClick={() => setFiltroRapidoPlaca(opcao.value)}
              className={filterChipClass(
                filtroRapidoPlaca === opcao.value,
                opcao.value === 'nao_alocadas' ? 'tertiary' : 'default',
              )}
            >
              {opcao.label}
              {opcao.value === 'nao_alocadas' && placasDisponiveis > 0 && (
                <span className="rounded-full bg-tertiary/20 px-1.5 py-px text-[9px] font-bold">
                  {placasDisponiveis}
                </span>
              )}
              {opcao.value === 'alocadas' && placasAlocadas > 0 && (
                <span className="rounded-full bg-primary/20 px-1.5 py-px text-[9px] font-bold">
                  {placasAlocadas}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div
        className={cn(
          'space-y-1.5 overflow-y-auto pr-0.5',
          preencherAltura
            ? 'min-h-0 flex-1'
            : compacto
              ? 'max-h-[280px]'
              : 'max-h-[min(400px,50vh)]',
        )}
      >
        {veiculosFiltrados.length ? (
          veiculosFiltrados.map((veiculo) => (
            <PlacaVeiculoCard
              key={veiculo.id}
              veiculo={veiculo}
              rotaAlocada={transportePorVeiculo.get(veiculo.id)?.rota}
              transporteAlvo={transporteAlvo}
              selecionado={veiculoSelecionadoId === veiculo.id}
              modo={modo}
              modoTransportador={modoTransportador}
              processando={processando}
              onAcao={() => onSelecionarPlaca(veiculo.id)}
            />
          ))
        ) : (
          <p className="py-6 text-center text-[10px] text-muted-foreground">
            {modoTransportador && filtroRapidoPlaca === 'nao_alocadas'
              ? 'Nenhuma placa disponível no momento.'
              : modoTransportador && filtroRapidoPlaca === 'alocadas'
                ? 'Nenhuma placa alocada.'
                : 'Nenhuma placa encontrada.'}
          </p>
        )}
      </div>
    </div>
  );
}
