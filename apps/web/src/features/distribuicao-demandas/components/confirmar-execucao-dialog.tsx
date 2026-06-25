'use client';

import { useEffect, useState } from 'react';

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

import { useSessoesAbertasParaExecucao } from '@/features/distribuicao-demandas/hooks/use-sessoes-abertas-execucao';

type ConfirmarExecucaoDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (sessaoId: string) => void;
};

export function ConfirmarExecucaoDialog({
  open,
  isSubmitting,
  onClose,
  onConfirm,
}: ConfirmarExecucaoDialogProps) {
  const { sessoesAbertas, isLoading, reload } = useSessoesAbertasParaExecucao();
  const [sessaoId, setSessaoId] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    void reload();
  }, [open, reload]);

  useEffect(() => {
    if (sessoesAbertas.length === 0) {
      setSessaoId('');
      return;
    }
    setSessaoId((prev) =>
      prev && sessoesAbertas.some((s) => s.id === prev)
        ? prev
        : (sessoesAbertas[0]?.id ?? ''),
    );
  }, [sessoesAbertas]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar execução</DialogTitle>
          <DialogDescription>
            A simulação usa quantidades informadas. Para criar demandas no sistema,
            selecione a sessão operacional aberta que receberá as atribuições.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : sessoesAbertas.length === 0 ? (
          <p className="text-sm text-destructive">
            Nenhuma sessão aberta. Abra uma sessão operacional antes de executar.
          </p>
        ) : (
          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">Sessão operacional</span>
            <select
              className="w-full rounded-md border border-outline-variant bg-surface-low px-2 py-2"
              value={sessaoId}
              onChange={(e) => setSessaoId(e.target.value)}
              disabled={isSubmitting}
            >
              {sessoesAbertas.map((s) => (
                <option key={s.id} value={s.id}>
                  Sessão {s.id.slice(0, 8)} — {s.equipeNome} ({s.dataReferencia})
                </option>
              ))}
            </select>
          </label>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={() => sessaoId && onConfirm(sessaoId)}
            disabled={isSubmitting || !sessaoId || sessoesAbertas.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1 size-4 animate-spin" />
                Executando…
              </>
            ) : (
              'Executar distribuição'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
