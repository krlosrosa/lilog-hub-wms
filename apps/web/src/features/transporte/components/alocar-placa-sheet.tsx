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
import { Loader2, MapPin, Package, Truck } from 'lucide-react';

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
  'w-full rounded-md border border-outline-variant bg-surface-low px-2 py-1.5',
  'text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring',
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
          'flex h-full w-[min(72vw,1280px)] min-w-[720px] max-w-none flex-col gap-0',
          'border-outline-variant bg-card p-0 sm:max-w-none',
        )}
      >
        <SheetHeader className="shrink-0 border-b border-outline-variant px-6 py-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Truck className="size-5 text-primary" aria-hidden />
            {modoTransportador
              ? transporte.veiculoAlocado
                ? 'Trocar placa'
                : 'Alocar placa'
              : 'Alocar placa'}{' '}
            — {transporte.rota}
          </SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-wrap items-center gap-2">
              <TransporteStatusBadge status={transporte.status} />
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-highest px-2 py-0.5 text-[10px] text-muted-foreground ring-1 ring-inset ring-outline-variant/50">
                <Package className="size-3" aria-hidden />
                {transporte.quantidadeRemessas} NFs ·{' '}
                {formatarPesoCompacto(transporte.pesoTotal)}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="size-3" aria-hidden />
                {transporte.cidade} · {transporte.bairro}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Perfil esperado:
              </span>
              <PerfilVeiculoBadge
                tipo={transporte.perfilEsperado}
                variante="esperado"
              />
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="flex w-[44%] min-w-[280px] flex-col border-r border-outline-variant bg-surface-low/30">
            <div className="shrink-0 border-b border-outline-variant px-4 py-3">
              <h3 className="text-xs font-semibold text-foreground">
                {modoTransportador ? 'Frota da transportadora' : 'Placas cadastradas'}
              </h3>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {carregandoVeiculos
                  ? 'Carregando placas do banco...'
                  : modoTransportador
                    ? `${placasDisponiveis} disponíveis · ${veiculos.length} placas`
                    : `${totalDisponiveis} livres · ${veiculos.length} placas cadastradas`}
              </p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
              {carregandoVeiculos ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12">
                  <Loader2
                    className="size-6 animate-spin text-muted-foreground"
                    aria-hidden
                  />
                  <p className="text-xs text-muted-foreground">
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

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              {veiculoSelecionado ? (
                <>
                  <div className="space-y-3 rounded-xl border border-outline-variant bg-surface-low/80 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-primary">
                      Perfil do veículo selecionado
                    </h4>
                    {!placaTemPerfilTarifa(veiculoSelecionado) && (
                      <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        Esta placa não possui perfil de tarifa cadastrado e não
                        pode ser alocada.
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground">
                          Placa
                        </span>
                        <p className="font-mono text-sm font-bold">
                          {veiculoSelecionado.placa}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">
                          Perfil tarifa
                        </span>
                        <p className="mt-0.5 font-medium">
                          {veiculoSelecionado.perfilTarifaNome ?? (
                            <span className="text-destructive">Sem perfil</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">
                          Tipo
                        </span>
                        <p className="mt-0.5">
                          <PerfilVeiculoBadge
                            tipo={veiculoSelecionado.tipo}
                            divergente={perfilDivergente}
                            variante="alocado"
                          />
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">
                          Capacidade
                        </span>
                        <p>
                          {nf.format(veiculoSelecionado.capacidadePeso)} kg /{' '}
                          {veiculoSelecionado.capacidadeVolume} m³
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">
                          Transportadora
                        </span>
                        <p className="font-medium">
                          {veiculoSelecionado.transportadora || '—'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-muted-foreground">
                          Motorista
                        </span>
                        <p>
                          {veiculoSelecionado.motorista || '—'} · CNH{' '}
                          {veiculoSelecionado.cnhCategoria || '—'} ·{' '}
                          {TIPO_FRETE_LABELS[veiculoSelecionado.tipoFrete]}
                        </p>
                      </div>
                    </div>

                    {veiculoSelecionado.capacidadePeso > 0 && (
                      <div>
                        <div className="mb-1 flex justify-between text-[10px]">
                          <span className="text-muted-foreground">
                            Ocupação de peso
                          </span>
                          <span className="font-semibold tabular-nums">
                            {nf.format(ocupacao.peso)} /{' '}
                            {nf.format(veiculoSelecionado.capacidadePeso)} kg (
                            {ocupacao.percentual}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              ocupacao.percentual > 90
                                ? 'bg-destructive'
                                : ocupacao.percentual > 75
                                  ? 'bg-secondary'
                                  : 'bg-tertiary',
                            )}
                            style={{ width: `${ocupacao.percentual}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {!modoTransportador && (
                    <div className="space-y-3 rounded-xl border border-outline-variant bg-surface-low/80 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wide text-primary">
                        Como será pago?
                      </h4>

                      <label className="flex items-center gap-2 text-xs text-foreground">
                        <input
                          type="checkbox"
                          checked={semCusto}
                          onChange={(event) => {
                            setSemCusto(event.target.checked);
                            if (event.target.checked) {
                              setPerfilPagamentoId('');
                            } else if (veiculoSelecionado.perfilTarifaId) {
                              setPerfilPagamentoId(
                                veiculoSelecionado.perfilTarifaId,
                              );
                            }
                          }}
                          className="size-3.5 rounded border-input accent-primary"
                        />
                        Transporte sem custo
                      </label>

                      {!semCusto && (
                        <div className="space-y-1.5">
                          <label
                            htmlFor="perfil-pagamento"
                            className="text-[10px] font-medium text-muted-foreground"
                          >
                            Perfil de pagamento
                          </label>
                          <select
                            id="perfil-pagamento"
                            value={perfilPagamentoId}
                            onChange={(event) =>
                              setPerfilPagamentoId(event.target.value)
                            }
                            className={filterInputClass}
                          >
                            <option value="">Selecione um perfil</option>
                            {perfisTarifas.map((perfil) => (
                              <option key={perfil.id} value={perfil.id}>
                                {perfil.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {semCusto ? (
                        <p className="rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-2 text-xs text-secondary">
                          Veículo alocado como{' '}
                          <strong>{veiculoSelecionado.perfilTarifaNome}</strong>
                          , sem cobrança de frete.
                        </p>
                      ) : perfilPagamentoDivergente && perfilPagamentoSelecionado ? (
                        <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                          Veículo alocado como{' '}
                          <strong>{veiculoSelecionado.perfilTarifaNome}</strong>,
                          pago como{' '}
                          <strong>{perfilPagamentoSelecionado.nome}</strong>.
                        </p>
                      ) : perfilPagamentoSelecionado ? (
                        <p className="rounded-lg border border-outline-variant bg-surface-highest px-3 py-2 text-xs text-muted-foreground">
                          Veículo alocado e pago como{' '}
                          <strong className="text-foreground">
                            {perfilPagamentoSelecionado.nome}
                          </strong>
                          .
                        </p>
                      ) : null}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-outline-variant px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Selecione uma placa na lista ao lado
                  </p>
                </div>
              )}
            </div>

            <SheetFooter className="shrink-0 flex-row gap-2 border-t border-outline-variant px-6 py-4">
              <Button
                type="button"
                variant="outline"
                disabled={processando}
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={processando || !podeConfirmar}
                onClick={handleConfirmar}
                className="flex-1 gap-2"
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
