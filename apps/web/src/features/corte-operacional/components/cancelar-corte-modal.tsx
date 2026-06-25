'use client';

import { useState } from 'react';

import { Button } from '@lilog/ui';

type CancelarCorteModalProps = {
  open: boolean;
  processando: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<boolean>;
};

export function CancelarCorteModal({
  open,
  processando,
  onClose,
  onConfirm,
}: CancelarCorteModalProps) {
  const [motivo, setMotivo] = useState('');

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-cancelar-corte"
        className="w-full max-w-md rounded-xl border border-outline-variant bg-surface p-5 shadow-lg"
      >
        <h2
          id="titulo-cancelar-corte"
          className="text-base font-semibold text-foreground"
        >
          Cancelar corte
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Informe o motivo do cancelamento. Esta ação não altera o mapa original.
        </p>
        <textarea
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          rows={4}
          placeholder="Motivo do cancelamento…"
          className="mt-4 w-full rounded-md border border-outline-variant/60 bg-surface-low px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Voltar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={processando || !motivo.trim()}
            onClick={async () => {
              const ok = await onConfirm(motivo.trim());
              if (ok) {
                setMotivo('');
                onClose();
              }
            }}
          >
            Confirmar cancelamento
          </Button>
        </div>
      </div>
    </div>
  );
}
