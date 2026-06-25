'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';
import { Loader2 } from 'lucide-react';

import type { MapaLoteResumo } from '@/features/transporte/lib/gerar-mapas-api';

const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

type SalvarMapasModalProps = {
  aberto: boolean;
  resumo: MapaLoteResumo | null;
  salvando: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
};

export function SalvarMapasModal({
  aberto,
  resumo,
  salvando,
  onConfirmar,
  onCancelar,
}: SalvarMapasModalProps) {
  if (!resumo) {
    return null;
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && onCancelar()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmar salvamento dos mapas</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-outline-variant bg-surface-low/40 p-3 text-xs">
            <div>
              <p className="text-muted-foreground">Transportes</p>
              <p className="font-semibold tabular-nums">{resumo.totalTransportes}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Grupos</p>
              <p className="font-semibold tabular-nums">{resumo.totalGrupos}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Linhas</p>
              <p className="font-semibold tabular-nums">{resumo.totalItens}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Peso total</p>
              <p className="font-semibold tabular-nums">
                {nf.format(resumo.pesoTotalKg)} kg
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-outline-variant">
            <table className="w-full text-xs">
              <thead className="bg-surface-low/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Transporte</th>
                  <th className="px-3 py-2 font-medium">Placa</th>
                  <th className="px-3 py-2 text-right font-medium">Grupos</th>
                  <th className="px-3 py-2 text-right font-medium">Peso</th>
                </tr>
              </thead>
              <tbody>
                {resumo.transportes.map((transporte) => (
                  <tr
                    key={transporte.transporteId}
                    className="border-t border-outline-variant/60"
                  >
                    <td className="px-3 py-2 font-medium">{transporte.rota}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {transporte.placa ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {transporte.totalGrupos}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {nf.format(transporte.pesoTotalKg)} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={salvando}
            onClick={onCancelar}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={salvando}
            onClick={onConfirmar}
          >
            {salvando ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Salvando...
              </>
            ) : (
              'Confirmar salvamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
