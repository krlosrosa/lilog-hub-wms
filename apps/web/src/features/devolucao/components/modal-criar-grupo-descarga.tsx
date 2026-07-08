'use client';

import { useState } from 'react';

import { Loader2 } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';

import type { DemandaDevolucaoListItem } from '@/features/devolucao/types/devolucao-gestao.schema';

type ModalCriarGrupoDescargaProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidadeId: string | null;
  demandasSelecionadas: DemandaDevolucaoListItem[];
  isSubmitting: boolean;
  onSubmit: (values: {
    placaDescarga: string;
    doca: string;
    cargaSegregada: boolean;
    paletesEsperados: number | null;
    observacao: string;
    liberarConferencia: boolean;
  }) => Promise<void | { success: boolean }>;
};

const labelClassName = 'text-label-md font-medium text-foreground';
const inputClassName =
  'h-9 w-full rounded-md border border-outline-variant bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

export function ModalCriarGrupoDescarga({
  open,
  onOpenChange,
  unidadeId,
  demandasSelecionadas,
  isSubmitting,
  onSubmit,
}: ModalCriarGrupoDescargaProps) {
  const [placaDescarga, setPlacaDescarga] = useState('');
  const [doca, setDoca] = useState('');
  const [cargaSegregada, setCargaSegregada] = useState(false);
  const [paletesEsperados, setPaletesEsperados] = useState('');
  const [observacao, setObservacao] = useState('');
  const [liberarConferencia, setLiberarConferencia] = useState(true);

  const handleSubmit = async () => {
    if (!placaDescarga.trim()) return;

    await onSubmit({
      placaDescarga: placaDescarga.trim().toUpperCase(),
      doca: doca.trim(),
      cargaSegregada,
      paletesEsperados: paletesEsperados ? Number(paletesEsperados) : null,
      observacao: observacao.trim(),
      liberarConferencia,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar descarga agrupada</DialogTitle>
          <DialogDescription>
            Agrupe {demandasSelecionadas.length} demanda(s) para descarga no
            mesmo caminhão. O conferente receberá uma única operação física.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-outline-variant bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Demandas selecionadas
            </p>
            <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-xs">
              {demandasSelecionadas.map((demanda) => (
                <li key={demanda.id} className="font-mono">
                  {demanda.codigoDemanda} · {demanda.placa ?? '—'} ·{' '}
                  {demanda.totalNfs} NF(s)
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="placa-descarga" className={labelClassName}>
                Placa real do caminhão
              </label>
              <input
                id="placa-descarga"
                className={inputClassName}
                value={placaDescarga}
                onChange={(e) => setPlacaDescarga(e.target.value)}
                placeholder="ABC-1234"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="doca-grupo" className={labelClassName}>
                Doca
              </label>
              <input
                id="doca-grupo"
                className={inputClassName}
                value={doca}
                onChange={(e) => setDoca(e.target.value)}
                placeholder="D-03"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="paletes-grupo" className={labelClassName}>
                Paletes esperados
              </label>
              <input
                id="paletes-grupo"
                type="number"
                min={0}
                className={inputClassName}
                value={paletesEsperados}
                onChange={(e) => setPaletesEsperados(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 pt-7 text-sm">
              <input
                type="checkbox"
                checked={cargaSegregada}
                onChange={(e) => setCargaSegregada(e.target.checked)}
              />
              Carga segregada
            </label>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="obs-grupo" className={labelClassName}>
              Observação
            </label>
            <textarea
              id="obs-grupo"
              className="min-h-20 w-full rounded-md border border-outline-variant bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              placeholder="Ex.: cargas consolidadas pela transportadora"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={liberarConferencia}
              onChange={(e) => setLiberarConferencia(e.target.checked)}
            />
            Liberar imediatamente para conferência
          </label>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || !unidadeId || !placaDescarga.trim()}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Criar e liberar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
