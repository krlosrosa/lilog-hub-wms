'use client';

import { useEffect, useMemo, useState } from 'react';

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
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Package,
  Scale,
  Truck,
  User,
} from 'lucide-react';

import { PerfilVeiculoBadge } from '@/features/transporte/components/perfil-veiculo-badge';
import { PlacasLista } from '@/features/transporte/components/placas-lista';
import { TransporteStatusBadge } from '@/features/transporte/components/transporte-status-badge';
import type { PerfilTarifaItem } from '@/features/transporte/types/perfil-tarifa.schema';
import type {
  PagamentoAlocacao,
  TransporteGrupo,
  Veiculo,
} from '@/features/transporte/types/transporte.schema';
import { TIPO_FRETE_LABELS } from '@/features/transporte/types/transporte.schema';

const nf = new Intl.NumberFormat('pt-BR');

const filterInputClass = cn(
  'w-full rounded-lg border border-outline-variant bg-surface-low px-3 py-2.5',
  'text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40',
);

type AlocarPlacaSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transporte: TransporteGrupo | null;
  veiculos: Veiculo[];
  transportes: TransporteGrupo[];
  perfisTarifas?: PerfilTarifaItem[];
  processando: boolean;
  carregandoVeiculos?: boolean;
  transportadorasOpcoes?: string[];
  /** Oculta controles administrativos — usado no portal do transportador. */
  modoTransportador?: boolean;
  onConfirmar: (veiculoId: string, pagamento: PagamentoAlocacao) => void;
};

function formatarPesoCompacto(peso: number): string {
  if (peso >= 1000) {
    return `${(peso / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}t`;
  }
  return `${nf.format(peso)} kg`;
}

function placaTemPerfilTarifa(veiculo: Veiculo): boolean {
  return Boolean(veiculo.perfilTarifaId && veiculo.perfilTarifaNome?.trim());
}

function buildPagamentoPadrao(
  veiculo: Veiculo | undefined,
  transporte: TransporteGrupo | null,
): { semCusto: boolean; perfilPagamentoId: string } {
  if (transporte?.freteSemCusto) {
    return { semCusto: true, perfilPagamentoId: '' };
  }

  if (transporte?.perfilPagamentoId) {
    return {
      semCusto: false,
      perfilPagamentoId: transporte.perfilPagamentoId,
    };
  }

  return {
    semCusto: false,
    perfilPagamentoId: veiculo?.perfilTarifaId ?? '',
  };
}

export function AlocarPlacaSheet({
  open,
  onOpenChange,
  transporte,
  veiculos,
  transportes,
  perfisTarifas = [],
  processando,
  carregandoVeiculos = false,
  transportadorasOpcoes,
  modoTransportador = false,
  onConfirmar,
}: AlocarPlacaSheetProps) {
  const veiculosCompativeis = useMemo(() => {
    if (modoTransportador) {
      return veiculos;
    }

    if (!transporte) {
      return veiculos;
    }

    return veiculos.filter(
      (veiculo) =>
        veiculo.disponivel ||
        veiculo.id === transporte.veiculoAlocado?.veiculoId,
    );
  }, [transporte, veiculos, modoTransportador]);

  const [veiculoId, setVeiculoId] = useState('');
  const [semCusto, setSemCusto] = useState(false);
  const [perfilPagamentoId, setPerfilPagamentoId] = useState('');

  const totalDisponiveis = veiculos.filter((v) => v.disponivel).length;
  const placasDisponiveis = totalDisponiveis;

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!veiculosCompativeis.length) {
      setVeiculoId('');
      return;
    }

    const atual = transporte?.veiculoAlocado?.veiculoId;
    const existeAtual = veiculosCompativeis.some(
      (veiculo) => veiculo.id === atual,
    );

    const primeiraComPerfil = veiculosCompativeis.find(placaTemPerfilTarifa);

    setVeiculoId(
      existeAtual && atual
        ? atual
        : primeiraComPerfil?.id ?? veiculosCompativeis[0]!.id,
    );
  }, [open, transporte, veiculosCompativeis]);

  const veiculoSelecionado = useMemo(
    () => veiculos.find((veiculo) => veiculo.id === veiculoId),
    [veiculoId, veiculos],
  );

  useEffect(() => {
    if (!open || modoTransportador) {
      return;
    }

    const padrao = buildPagamentoPadrao(veiculoSelecionado, transporte);
    setSemCusto(padrao.semCusto);
    setPerfilPagamentoId(padrao.perfilPagamentoId);
  }, [open, modoTransportador, veiculoSelecionado, transporte]);

  const perfilPagamentoSelecionado = useMemo(
    () => perfisTarifas.find((perfil) => perfil.id === perfilPagamentoId),
    [perfisTarifas, perfilPagamentoId],
  );

  const ocupacao = useMemo(() => {
    if (!transporte || !veiculoSelecionado) {
      return { peso: 0, percentual: 0 };
    }

    const capacidade = veiculoSelecionado.capacidadePeso;
    if (capacidade <= 0) {
      return { peso: transporte.pesoTotal, percentual: 0 };
    }

    const pesoTotal = transporte.pesoTotal + veiculoSelecionado.pesoAlocado;
    const percentual = Math.min(
      100,
      Math.round((pesoTotal / capacidade) * 100),
    );

    return { peso: pesoTotal, percentual };
  }, [transporte, veiculoSelecionado]);

  if (!transporte) {
    return null;
  }

  const perfilDivergente =
    veiculoSelecionado !== undefined &&
    veiculoSelecionado.tipo !== transporte.perfilEsperado;

  const perfilPagamentoDivergente =
    !semCusto &&
    Boolean(veiculoSelecionado?.perfilTarifaId) &&
    perfilPagamentoId !== veiculoSelecionado?.perfilTarifaId;

  const podeConfirmar =
    Boolean(veiculoId) &&
    Boolean(veiculoSelecionado) &&
    placaTemPerfilTarifa(veiculoSelecionado!) &&
    (modoTransportador || semCusto || Boolean(perfilPagamentoId));

  const handleConfirmar = () => {
    if (modoTransportador) {
      onConfirmar(veiculoId, {
        perfilPagamentoId: veiculoSelecionado?.perfilTarifaId ?? null,
        perfilPagamentoNome: veiculoSelecionado?.perfilTarifaNome ?? null,
        semCusto: false,
      });
      return;
    }

    onConfirmar(veiculoId, {
      perfilPagamentoId: semCusto ? null : perfilPagamentoId,
      perfilPagamentoNome: semCusto
        ? null
        : perfilPagamentoSelecionado?.nome ?? null,
      semCusto,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'flex h-full w-[96vw] max-w-none flex-col gap-0',
          'rounded-l-2xl border-outline-variant bg-card p-0 shadow-2xl sm:max-w-none',
        )}
      >
        <SheetHeader className="shrink-0 space-y-0 border-b border-outline-variant/60 bg-surface-low/30 px-8 py-6 text-left">
          <div className="flex items-start justify-between gap-6 pr-10">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {modoTransportador
                  ? transporte.veiculoAlocado
                    ? 'Trocar placa'
                    : 'Alocar placa'
                  : 'Alocar placa'}
              </p>
              <SheetTitle className="truncate text-2xl font-bold tracking-tight text-foreground">
                {transporte.rota}
              </SheetTitle>
            </div>
            <TransporteStatusBadge status={transporte.status} />
          </div>

          <SheetDescription asChild>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-highest px-3 py-1 text-sm text-foreground ring-1 ring-inset ring-outline-variant/50">
                <Package className="size-3.5 text-muted-foreground" aria-hidden />
                {transporte.quantidadeRemessas} NFs ·{' '}
                {formatarPesoCompacto(transporte.pesoTotal)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-highest px-3 py-1 text-sm text-muted-foreground ring-1 ring-inset ring-outline-variant/50">
                <MapPin className="size-3.5" aria-hidden />
                {transporte.cidade} · {transporte.bairro}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface-highest px-3 py-1 text-sm ring-1 ring-inset ring-outline-variant/50">
                <span className="text-muted-foreground">Perfil esperado</span>
                <PerfilVeiculoBadge
                  tipo={transporte.perfilEsperado}
                  variante="esperado"
                />
              </span>
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="flex w-[52%] min-w-[320px] flex-col border-r border-outline-variant/60 bg-surface-low/20">
            <div className="shrink-0 px-6 py-5">
              <h3 className="text-base font-semibold text-foreground">
                {modoTransportador ? 'Frota da transportadora' : 'Escolha a placa'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {carregandoVeiculos
                  ? 'Carregando placas...'
                  : modoTransportador
                    ? `${placasDisponiveis} disponíveis de ${veiculos.length} placas`
                    : `${totalDisponiveis} livres de ${veiculos.length} cadastradas`}
              </p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
              {carregandoVeiculos ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
                  <Loader2
                    className="size-8 animate-spin text-muted-foreground"
                    aria-hidden
                  />
                  <p className="text-sm text-muted-foreground">
                    Carregando placas...
                  </p>
                </div>
              ) : (
                <PlacasLista
                  key={transporte.id}
                  veiculos={veiculos}
                  transportes={transportes}
                  transporteAlvo={transporte}
                  veiculoSelecionadoId={veiculoId}
                  processando={processando}
                  modo="selecionar"
                  modoTransportador={modoTransportador}
                  transportadorasOpcoes={transportadorasOpcoes}
                  preencherAltura
                  onSelecionarPlaca={setVeiculoId}
                />
              )}
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-surface-low/10">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {veiculoSelecionado ? (
                <div className="mx-auto flex max-w-xl flex-col gap-3">
                  {!placaTemPerfilTarifa(veiculoSelecionado) && (
                    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
                      <AlertCircle
                        className="mt-0.5 size-4 shrink-0 text-destructive"
                        aria-hidden
                      />
                      <p className="text-xs text-destructive">
                        Placa sem perfil de tarifa — cadastre em Transportadoras →
                        Placas.
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl border border-outline-variant bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="font-mono text-xl font-bold tracking-wide text-primary">
                          {veiculoSelecionado.placa}
                        </p>
                        <PerfilVeiculoBadge
                          tipo={veiculoSelecionado.tipo}
                          divergente={perfilDivergente}
                          variante="alocado"
                        />
                      </div>
                      {perfilDivergente && (
                        <span className="shrink-0 text-[11px] font-medium text-secondary">
                          Perfil divergente
                        </span>
                      )}
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <dt className="text-[11px] text-muted-foreground">Tarifa</dt>
                        <dd className="mt-0.5 font-medium text-foreground">
                          {veiculoSelecionado.perfilTarifaNome ?? (
                            <span className="text-destructive">Sem perfil</span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] text-muted-foreground">
                          Capacidade
                        </dt>
                        <dd className="mt-0.5 font-medium text-foreground">
                          {nf.format(veiculoSelecionado.capacidadePeso)} kg ·{' '}
                          {veiculoSelecionado.capacidadeVolume} m³
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Truck className="size-3" aria-hidden />
                          Transportadora
                        </dt>
                        <dd className="mt-0.5 font-medium text-foreground">
                          {veiculoSelecionado.transportadora || '—'}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <User className="size-3" aria-hidden />
                          Motorista
                        </dt>
                        <dd className="mt-0.5 text-foreground">
                          {veiculoSelecionado.motorista || '—'}
                          {veiculoSelecionado.cnhCategoria && (
                            <span className="text-muted-foreground">
                              {' '}
                              · CNH {veiculoSelecionado.cnhCategoria}
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            {' '}
                            · {TIPO_FRETE_LABELS[veiculoSelecionado.tipoFrete]}
                          </span>
                        </dd>
                      </div>
                    </dl>

                    {veiculoSelecionado.capacidadePeso > 0 && (
                      <div className="mt-3 flex items-center gap-2 border-t border-outline-variant/50 pt-3">
                        <Scale
                          className="size-3.5 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-container">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300',
                              ocupacao.percentual > 90
                                ? 'bg-destructive'
                                : ocupacao.percentual > 75
                                  ? 'bg-secondary'
                                  : 'bg-tertiary',
                            )}
                            style={{ width: `${ocupacao.percentual}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-foreground">
                          {ocupacao.percentual}%
                        </span>
                        <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">
                          {nf.format(ocupacao.peso)}/
                          {nf.format(veiculoSelecionado.capacidadePeso)} kg
                        </span>
                      </div>
                    )}
                  </div>

                  {!modoTransportador && (
                    <div className="rounded-xl border border-outline-variant bg-card p-4 shadow-sm">
                      <h4 className="text-sm font-semibold text-foreground">
                        Pagamento do frete
                      </h4>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <label
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors',
                            semCusto
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                              : 'border-outline-variant hover:bg-surface-low/50',
                          )}
                        >
                          <input
                            type="radio"
                            name="tipo-pagamento"
                            checked={semCusto}
                            onChange={() => {
                              setSemCusto(true);
                              setPerfilPagamentoId('');
                            }}
                            className="size-3.5 accent-primary"
                          />
                          <span className="text-xs font-medium text-foreground">
                            Sem custo
                          </span>
                        </label>

                        <label
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-colors',
                            !semCusto
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                              : 'border-outline-variant hover:bg-surface-low/50',
                          )}
                        >
                          <input
                            type="radio"
                            name="tipo-pagamento"
                            checked={!semCusto}
                            onChange={() => {
                              setSemCusto(false);
                              if (veiculoSelecionado.perfilTarifaId) {
                                setPerfilPagamentoId(
                                  veiculoSelecionado.perfilTarifaId,
                                );
                              }
                            }}
                            className="size-3.5 accent-primary"
                          />
                          <span className="text-xs font-medium text-foreground">
                            Com perfil
                          </span>
                        </label>
                      </div>

                      {!semCusto && (
                        <select
                          id="perfil-pagamento"
                          value={perfilPagamentoId}
                          onChange={(event) =>
                            setPerfilPagamentoId(event.target.value)
                          }
                          className={cn(filterInputClass, 'mt-2 py-2 text-xs')}
                        >
                          <option value="">Selecione um perfil</option>
                          {perfisTarifas.map((perfil) => (
                            <option key={perfil.id} value={perfil.id}>
                              {perfil.nome}
                            </option>
                          ))}
                        </select>
                      )}

                      {(semCusto ||
                        perfilPagamentoDivergente ||
                        perfilPagamentoSelecionado) && (
                        <div
                          className={cn(
                            'mt-2 flex items-start gap-1.5 rounded-lg px-3 py-2 text-xs',
                            semCusto
                              ? 'bg-secondary/10 text-secondary'
                              : perfilPagamentoDivergente
                                ? 'bg-primary/10 text-primary'
                                : 'bg-surface-low text-muted-foreground',
                          )}
                        >
                          <CheckCircle2
                            className="mt-0.5 size-3.5 shrink-0"
                            aria-hidden
                          />
                          <p>
                            {semCusto ? (
                              <>
                                Alocado como{' '}
                                <strong>{veiculoSelecionado.perfilTarifaNome}</strong>
                                , sem cobrança.
                              </>
                            ) : perfilPagamentoDivergente &&
                              perfilPagamentoSelecionado ? (
                              <>
                                Alocado como{' '}
                                <strong>{veiculoSelecionado.perfilTarifaNome}</strong>
                                , pago como{' '}
                                <strong>{perfilPagamentoSelecionado.nome}</strong>.
                              </>
                            ) : perfilPagamentoSelecionado ? (
                              <>
                                Pago como{' '}
                                <strong>{perfilPagamentoSelecionado.nome}</strong>.
                              </>
                            ) : null}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant bg-surface-low/30 px-6 py-8 text-center">
                  <Truck
                    className="mb-3 size-8 text-muted-foreground/40"
                    aria-hidden
                  />
                  <p className="text-sm font-medium text-foreground">
                    Selecione uma placa
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                    Escolha um veículo na lista ao lado para confirmar a
                    alocação.
                  </p>
                </div>
              )}
            </div>

            <SheetFooter className="shrink-0 gap-2 border-t border-outline-variant/60 bg-card px-6 py-3">
              <Button
                type="button"
                variant="outline"
                disabled={processando}
                onClick={() => onOpenChange(false)}
                className="min-w-[120px]"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={processando || !podeConfirmar}
                onClick={handleConfirmar}
                className="min-w-[160px] gap-2"
              >
                {processando ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Alocando…
                  </>
                ) : modoTransportador ? (
                  'Confirmar troca'
                ) : (
                  'Confirmar alocação'
                )}
              </Button>
            </SheetFooter>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
