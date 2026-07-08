'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';
import { Check, Copy, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { QrCodePreview } from '@/features/peso-variavel/components/qr-code-preview';
import { gerarLinkRastreio } from '@/features/recebimento/lib/recebimento-api';
import { ApiClientError } from '@/lib/api';

type ModalLinkRastreioProps = {
  open: boolean;
  onClose: () => void;
  preRecebimentoId: string;
  placa: string;
};

export function ModalLinkRastreio({
  open,
  onClose,
  preRecebimentoId,
  placa,
}: ModalLinkRastreioProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const carregarLink = useCallback(
    async (regenerar = false) => {
      if (regenerar) {
        setIsRegenerating(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      setCopied(false);

      try {
        const result = await gerarLinkRastreio(preRecebimentoId, regenerar);
        setUrl(result.url);
        if (regenerar) {
          toast.success('Novo link gerado');
        }
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : 'Não foi possível gerar o link de rastreio';
        setError(message);
        setUrl(null);
      } finally {
        setIsLoading(false);
        setIsRegenerating(false);
      }
    },
    [preRecebimentoId],
  );

  useEffect(() => {
    if (open) {
      void carregarLink(false);
    } else {
      setUrl(null);
      setError(null);
      setCopied(false);
    }
  }, [open, carregarLink]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isLoading && !isRegenerating) {
        onClose();
      }
    },
    [isLoading, isRegenerating, onClose],
  );

  const handleCopy = useCallback(async () => {
    if (!url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copiado');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  }, [url]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link de acompanhamento</DialogTitle>
          <DialogDescription>
            Compartilhe com o motorista do veículo{' '}
            <span className="font-semibold text-foreground">{placa}</span>.
            O link é público e não exige login.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {isLoading ? (
            <div className="flex h-48 w-full items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
            </div>
          ) : error ? (
            <div className="w-full rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : url ? (
            <>
              <QrCodePreview value={url} qrSize={200} title="QR code de rastreio" />
              <div className="w-full rounded-lg border border-outline-variant bg-muted/30 p-3">
                <p className="break-all text-xs text-muted-foreground">{url}</p>
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading || isRegenerating || Boolean(error)}
            onClick={() => void carregarLink(true)}
          >
            {isRegenerating ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Regenerando…
              </>
            ) : (
              <>
                <RefreshCw className="size-4" aria-hidden />
                Regenerar link
              </>
            )}
          </Button>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={onClose}
            >
              Fechar
            </Button>
            <Button
              type="button"
              disabled={!url || isLoading}
              onClick={() => void handleCopy()}
            >
              {copied ? (
                <>
                  <Check className="size-4" aria-hidden />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="size-4" aria-hidden />
                  Copiar link
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
