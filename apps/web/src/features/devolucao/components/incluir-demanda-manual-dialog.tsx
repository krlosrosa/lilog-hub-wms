'use client';

import { useEffect, useState } from 'react';

import { Loader2, Plus, Route, Truck } from 'lucide-react';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';

import { ApiClientError } from '@/lib/api';

import { incluirDemandaManual } from '@/features/devolucao/lib/devolucao-api';

type IncluirDemandaManualDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidadeId: string | null;
  onSuccess: () => Promise<void>;
};

type ModoBusca = 'transporte' | 'viagem';

const labelClassName = 'text-label-md font-medium text-foreground';

export function IncluirDemandaManualDialog({
  open,
  onOpenChange,
  unidadeId,
  onSuccess,
}: IncluirDemandaManualDialogProps) {
  const [modo, setModo] = useState<ModoBusca>('transporte');
  const [numeroTransporte, setNumeroTransporte] = useState('');
  const [viagemId, setViagemId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setModo('transporte');
      setNumeroTransporte('');
      setViagemId('');
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!unidadeId) {
      toast.error('Selecione uma unidade para incluir a demanda.');
      return;
    }

    const transporte = numeroTransporte.trim();
    const viagem = viagemId.trim();

    if (modo === 'transporte' && !transporte) {
      toast.error('Informe o número do transporte.');
      return;
    }

    if (modo === 'viagem' && !viagem) {
      toast.error('Informe o ID da viagem RAVEX.');
      return;
    }

    if (modo === 'viagem' && !/^\d+$/.test(viagem)) {
      toast.error('O ID da viagem deve conter apenas números.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await incluirDemandaManual({
        unidadeId,
        ...(modo === 'transporte'
          ? { numeroTransporte: transporte }
          : { viagemId: Number(viagem) }),
      });

      if (!response.demanda) {
        toast.info(
          'Nenhuma anomalia encontrada no RAVEX para esta viagem. Demanda não criada.',
        );
        onOpenChange(false);
        return;
      }

      if (response.created) {
        toast.success(
          `Demanda ${response.demanda.codigoDemanda} criada com sucesso.`,
        );
      } else {
        toast.info(
          `Demanda ${response.demanda.codigoDemanda} já existia para esta viagem.`,
        );
      }

      await onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Não foi possível incluir a demanda manualmente.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-headline-md">
            <Plus className="size-5 text-primary" aria-hidden />
            Incluir demanda manual
          </DialogTitle>
          <DialogDescription>
            Informe o número do transporte ou o ID da viagem RAVEX para gerar a
            demanda de devolução com base nas anomalias registradas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={modo === 'transporte' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setModo('transporte')}
            >
              <Truck className="size-4" aria-hidden />
              Nº Transporte
            </Button>
            <Button
              type="button"
              variant={modo === 'viagem' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setModo('viagem')}
            >
              <Route className="size-4" aria-hidden />
              ID Viagem
            </Button>
          </div>

          {modo === 'transporte' ? (
            <label htmlFor="numero-transporte" className="block space-y-2">
              <span className={labelClassName}>Número do transporte</span>
              <input
                id="numero-transporte"
                type="text"
                value={numeroTransporte}
                onChange={(event) => setNumeroTransporte(event.target.value)}
                placeholder="Ex.: 1234567890"
                className="w-full rounded-lg border border-outline-variant bg-muted px-3 py-2 text-label-md focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting}
              />
            </label>
          ) : (
            <label htmlFor="viagem-id" className="block space-y-2">
              <span className={labelClassName}>ID da viagem RAVEX</span>
              <input
                id="viagem-id"
                type="text"
                inputMode="numeric"
                value={viagemId}
                onChange={(event) => setViagemId(event.target.value)}
                placeholder="Ex.: 19380977"
                className="w-full rounded-lg border border-outline-variant bg-muted px-3 py-2 text-label-md focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isSubmitting}
              />
            </label>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !unidadeId}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Processando...
              </>
            ) : (
              'Incluir demanda'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
