'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from '@lilog/ui';
import { Loader2, RotateCcw, Truck } from 'lucide-react';

import { calcularCustoPrevisto } from '@/features/transporte/lib/calcular-custo';
import type {
  NfReentregaPendente,
  TransporteGrupo,
  Veiculo,
} from '@/features/transporte/types/transporte.schema';
import { TIPO_VEICULO_LABELS } from '@/features/transporte/types/transporte.schema';

const nf = new Intl.NumberFormat('pt-BR');

type ModoReentrega = 'transporte' | 'exclusiva';

type AlocarReentregaModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reentregas: NfReentregaPendente[];
  transportes: TransporteGrupo[];
  veiculos: Veiculo[];
  transportePreSelecionado?: TransporteGrupo | null;
  processando: boolean;
  onConfirmar: (reentregaIds: string[], transporteId: string) => void;
  onConfirmarExclusiva: (reentregaIds: string[], veiculoId: string) => void;
};

export function AlocarReentregaModal({
  open,
  onOpenChange,
  reentregas,
  transportes,
  veiculos,
  transportePreSelecionado,
  processando,
  onConfirmar,
  onConfirmarExclusiva,
}: AlocarReentregaModalProps) {
  const [modo, setModo] = useState<ModoReentrega>('transporte');
  const [selecionadas, setSelecionadas] = useState<Set<string>>(() => new Set());
  const [transporteId, setTransporteId] = useState('');
  const [veiculoId, setVeiculoId] = useState('');
  const [filtrarPorRegiao, setFiltrarPorRegiao] = useState(true);

  const veiculosDisponiveis = useMemo(
    () => veiculos.filter((veiculo) => veiculo.disponivel),
    [veiculos],
  );

  const transportesElegiveis = useMemo(() => {
    const base = [...transportes];

    if (!filtrarPorRegiao || selecionadas.size === 0) {
      return base;
    }

    const regioesSelecionadas = new Set(
      reentregas
        .filter((item) => selecionadas.has(item.id))
        .map((item) => item.regiao),
    );

    if (regioesSelecionadas.size !== 1) {
      return base;
    }

    const regiao = [...regioesSelecionadas][0]!;
    return base.filter((transporte) => transporte.regiao === regiao);
  }, [transportes, filtrarPorRegiao, selecionadas, reentregas]);

  const selecionadasLista = useMemo(
    () => reentregas.filter((item) => selecionadas.has(item.id)),
    [reentregas, selecionadas],
  );

  const impacto = useMemo(() => {
    const peso = selecionadasLista.reduce((acc, item) => acc + item.peso, 0);
    const volume = selecionadasLista.reduce((acc, item) => acc + item.volume, 0);
    return { peso, volume: Math.round(volume * 10) / 10, quantidade: selecionadasLista.length };
  }, [selecionadasLista]);

  const transporteDestino = useMemo(
    () => transportes.find((item) => item.id === transporteId),
    [transportes, transporteId],
  );

  const veiculoSelecionado = useMemo(
    () => veiculos.find((item) => item.id === veiculoId),
    [veiculos, veiculoId],
  );

  const custoExclusivo = useMemo(() => {
    if (!veiculoSelecionado) {
      return null;
    }
    return calcularCustoPrevisto(veiculoSelecionado.tipo).total;
  }, [veiculoSelecionado]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelecionadas(new Set());
    setModo(transportePreSelecionado ? 'transporte' : 'transporte');

    if (transportePreSelecionado) {
      setTransporteId(transportePreSelecionado.id);
      setFiltrarPorRegiao(true);
      return;
    }

    setTransporteId('');
    setVeiculoId('');
    setFiltrarPorRegiao(true);
  }, [open, transportePreSelecionado]);

  useEffect(() => {
    if (!open || modo !== 'transporte') {
      return;
    }

    const elegivelIds = new Set(transportesElegiveis.map((item) => item.id));

    if (transporteId && elegivelIds.has(transporteId)) {
      return;
    }

    if (
      transportePreSelecionado &&
      elegivelIds.has(transportePreSelecionado.id)
    ) {
      setTransporteId(transportePreSelecionado.id);
      return;
    }

    if (selecionadas.size > 0) {
      const selecionadasItems = reentregas.filter((item) =>
        selecionadas.has(item.id),
      );
      const transportesOriginais = [
        ...new Set(
          selecionadasItems
            .map((item) => item.transporteOriginal)
            .filter((item): item is string => Boolean(item)),
        ),
      ];

      if (transportesOriginais.length === 1) {
        const original = transportesOriginais[0]!;
        const porOriginal = transportesElegiveis.find(
          (item) => item.rota === original || item.regiao === original,
        );

        if (porOriginal) {
          setTransporteId(porOriginal.id);
          return;
        }
      }

      if (transportesElegiveis.length >= 1) {
        setTransporteId(transportesElegiveis[0]!.id);
        return;
      }
    }

    if (transporteId && !elegivelIds.has(transporteId)) {
      setTransporteId('');
    }
  }, [
    open,
    modo,
    transporteId,
    transportesElegiveis,
    transportePreSelecionado,
    selecionadas,
    reentregas,
  ]);

  useEffect(() => {
    if (!open || modo !== 'exclusiva') {
      return;
    }

    if (veiculoId && veiculosDisponiveis.some((item) => item.id === veiculoId)) {
      return;
    }

    if (veiculosDisponiveis.length > 0) {
      setVeiculoId(veiculosDisponiveis[0]!.id);
      return;
    }

    setVeiculoId('');
  }, [open, modo, veiculoId, veiculosDisponiveis]);

  const toggleSelecionada = (id: string) => {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const podeConfirmarTransporte =
    selecionadas.size > 0 && !!transporteId && reentregas.length > 0;

  const podeConfirmarExclusiva =
    selecionadas.size > 0 && !!veiculoId && reentregas.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-outline-variant bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <RotateCcw className="size-5 text-primary" aria-hidden />
            Alocar NF de Reentrega
          </DialogTitle>
          <DialogDescription>
            Selecione as notas fiscais de reentrega e vincule-as a um transporte
            existente ou a uma placa exclusiva.
          </DialogDescription>
        </DialogHeader>

        <div className="flex rounded-lg border border-outline-variant bg-surface-low p-1">
          <button
            type="button"
            disabled={processando}
            onClick={() => setModo('transporte')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors',
              modo === 'transporte'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Truck className="size-3.5" aria-hidden />
            Associar a Transporte
          </button>
          <button
            type="button"
            disabled={processando}
            onClick={() => setModo('exclusiva')}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors',
              modo === 'exclusiva'
                ? 'bg-secondary text-on-secondary shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Placa Exclusiva
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                NFs de Reentrega Pendentes
              </h4>
              <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-[10px] font-bold text-secondary">
                {reentregas.length} disponíveis
              </span>
            </div>

            <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-outline-variant p-2">
              {reentregas.length ? (
                reentregas.map((reentrega) => (
                  <label
                    key={reentrega.id}
                    className={cn(
                      'flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors',
                      selecionadas.has(reentrega.id)
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-outline-variant bg-surface-low hover:border-primary/30',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selecionadas.has(reentrega.id)}
                      onChange={() => toggleSelecionada(reentrega.id)}
                      className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          {reentrega.numeroNF}
                        </span>
                        <span className="shrink-0 rounded bg-secondary/20 px-1.5 py-0.5 text-[10px] font-bold text-secondary">
                          {reentrega.regiao}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-foreground">
                        {reentrega.destinatario}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {reentrega.motivo}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                        {nf.format(reentrega.peso)} kg ·{' '}
                        {reentrega.volume.toLocaleString('pt-BR', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}{' '}
                        m³
                      </p>
                    </div>
                  </label>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma NF de reentrega pendente no momento.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {modo === 'transporte' ? (
              <>
                <h4 className="text-sm font-semibold text-foreground">
                  Transporte de Destino
                </h4>

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={filtrarPorRegiao}
                    onChange={(event) => setFiltrarPorRegiao(event.target.checked)}
                    className="size-3.5 rounded border-input accent-primary"
                  />
                  Sugerir transportes da mesma região das NFs
                </label>

                <select
                  value={transporteId}
                  onChange={(event) => setTransporteId(event.target.value)}
                  disabled={!transportesElegiveis.length}
                  className={cn(
                    'w-full rounded-lg border border-outline-variant bg-surface-low px-3 py-2',
                    'text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                  )}
                >
                  <option value="">Selecione o transporte...</option>
                  {transportesElegiveis.map((transporte) => (
                    <option key={transporte.id} value={transporte.id}>
                      {transporte.rota} — {transporte.quantidadeRemessas} remessas —{' '}
                      {nf.format(transporte.pesoTotal)} kg
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <h4 className="text-sm font-semibold text-foreground">
                  Placa Exclusiva
                </h4>
                <p className="text-xs text-muted-foreground">
                  Aloca um veículo dedicado apenas para estas NFs de reentrega,
                  sem vínculo a um transporte existente.
                </p>

                <select
                  value={veiculoId}
                  onChange={(event) => setVeiculoId(event.target.value)}
                  disabled={!veiculosDisponiveis.length}
                  className={cn(
                    'w-full rounded-lg border border-outline-variant bg-surface-low px-3 py-2',
                    'text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                  )}
                >
                  <option value="">Selecione o veículo...</option>
                  {veiculosDisponiveis.map((veiculo) => (
                    <option key={veiculo.id} value={veiculo.id}>
                      {veiculo.placa} — {TIPO_VEICULO_LABELS[veiculo.tipo]} —{' '}
                      {veiculo.motorista}
                    </option>
                  ))}
                </select>

                {veiculoSelecionado && (
                  <div className="rounded-lg border border-outline-variant bg-surface-low p-3 text-xs">
                    <p className="font-semibold text-foreground">
                      {veiculoSelecionado.placa}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {veiculoSelecionado.transportadora} ·{' '}
                      {TIPO_VEICULO_LABELS[veiculoSelecionado.tipo]}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Capacidade: {nf.format(veiculoSelecionado.capacidadePeso)} kg ·{' '}
                      {veiculoSelecionado.capacidadeVolume.toLocaleString('pt-BR', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}{' '}
                      m³
                    </p>
                  </div>
                )}
              </>
            )}

            {impacto.quantidade > 0 && (
              <div className="space-y-2 rounded-lg border border-outline-variant bg-surface-low p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Impacto da alocação
                </p>
                <div className="flex justify-between text-sm">
                  <span>NFs selecionadas</span>
                  <span className="font-bold">{impacto.quantidade}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Peso adicional</span>
                  <span className="font-mono font-bold text-tertiary">
                    +{nf.format(impacto.peso)} kg
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Volume adicional</span>
                  <span className="font-mono font-bold text-tertiary">
                    +
                    {impacto.volume.toLocaleString('pt-BR', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })}{' '}
                    m³
                  </span>
                </div>
                {modo === 'transporte' && transporteDestino && (
                  <div className="border-t border-outline-variant pt-2 text-sm">
                    <span className="text-muted-foreground">Novo total em </span>
                    <span className="font-semibold text-foreground">
                      {transporteDestino.rota}
                    </span>
                    <span className="font-mono text-foreground">
                      : {nf.format(transporteDestino.pesoTotal + impacto.peso)} kg
                    </span>
                  </div>
                )}
                {modo === 'exclusiva' && veiculoSelecionado && custoExclusivo != null && (
                  <div className="border-t border-outline-variant pt-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Custo previsto</span>
                      <span className="font-mono font-bold text-tertiary">
                        {custoExclusivo.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={processando}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={
              processando ||
              (modo === 'transporte'
                ? !podeConfirmarTransporte
                : !podeConfirmarExclusiva)
            }
            onClick={() => {
              if (modo === 'transporte') {
                onConfirmar([...selecionadas], transporteId);
              } else {
                onConfirmarExclusiva([...selecionadas], veiculoId);
              }
            }}
            className="gap-2"
          >
            {processando ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Alocando…
              </>
            ) : modo === 'transporte' ? (
              'Alocar ao Transporte'
            ) : (
              'Alocar Placa Exclusiva'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
