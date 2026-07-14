'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';
import { CalendarClock, Loader2 } from 'lucide-react';

function formatDateInput(date: Date): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function formatTimeInput(date: Date): string {
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

function combinarDataHora(data: string, hora: string): Date | null {
  if (!data.trim() || !hora.trim()) {
    return null;
  }

  const parsed = new Date(`${data}T${hora}:00`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

type ModalReagendarRecebimentoProps = {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  onConfirmar: (novaData: Date) => Promise<void>;
};

export function ModalReagendarRecebimento({
  open,
  onClose,
  selectedIds,
  onConfirmar,
}: ModalReagendarRecebimentoProps) {
  const agora = useMemo(() => new Date(), [open]);
  const [data, setData] = useState(() => formatDateInput(new Date()));
  const [hora, setHora] = useState(() => formatTimeInput(new Date()));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = useCallback(() => {
    const now = new Date();
    setData(formatDateInput(now));
    setHora(formatTimeInput(now));
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  const horarioPrevisto = useMemo(
    () => combinarDataHora(data, hora),
    [data, hora],
  );

  const podeConfirmar = selectedIds.length > 0 && horarioPrevisto !== null;

  const handleConfirmar = useCallback(async () => {
    if (!podeConfirmar || !horarioPrevisto) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onConfirmar(horarioPrevisto);
      onClose();
    } catch {
      // Erro exibido pelo hook
    } finally {
      setIsSubmitting(false);
    }
  }, [horarioPrevisto, onClose, onConfirmar, podeConfirmar]);

  const quantidade = selectedIds.length;

  return (
    <Dialog
      open={open}
      onOpenChange={(aberto) => {
        if (!aberto && !isSubmitting) {
          onClose();
        }
      }}
    >
      <DialogContent className="border-outline-variant bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <CalendarClock className="size-4 text-primary" aria-hidden />
            Reagendar recebimento
            {quantidade > 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {quantidade === 1
              ? 'Defina a nova data e horário para o agendamento selecionado.'
              : `Defina a nova data e horário para os ${quantidade} agendamentos selecionados.`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <label
              htmlFor="reagendar-data"
              className="text-xs font-medium text-foreground"
            >
              Nova data
            </label>
            <input
              id="reagendar-data"
              type="date"
              value={data}
              min={formatDateInput(agora)}
              disabled={isSubmitting}
              onChange={(event) => setData(event.target.value)}
              className="h-9 w-full rounded-lg border border-outline-variant bg-surface-lowest px-3 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid gap-1.5">
            <label
              htmlFor="reagendar-hora"
              className="text-xs font-medium text-foreground"
            >
              Novo horário
            </label>
            <input
              id="reagendar-hora"
              type="time"
              value={hora}
              disabled={isSubmitting}
              onChange={(event) => setHora(event.target.value)}
              className="h-9 w-full rounded-lg border border-outline-variant bg-surface-lowest px-3 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!podeConfirmar || isSubmitting}
            onClick={() => void handleConfirmar()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Reagendando…
              </>
            ) : (
              'Confirmar reagendamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
