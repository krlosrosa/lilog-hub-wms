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
import { Check, Copy, Loader2, MessageCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { QrCodePreview } from '@/features/peso-variavel/components/qr-code-preview';
import { gerarLinkRastreio } from '@/features/recebimento/lib/recebimento-api';
import { ApiClientError } from '@/lib/api';

type ModalLinkRastreioProps = {
  open: boolean;
  onClose: () => void;
  preRecebimentoId: string;
  placa: string;
  motoristaNome?: string | null;
  motoristaTelefone?: string | null;
};

function normalizeTelefoneWhatsApp(telefone: string | null | undefined): string | null {
  if (!telefone) {
    return null;
  }

  const digits = telefone.replace(/\D/g, '');

  if (digits.length >= 12 && digits.startsWith('55')) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  if (digits.length >= 10) {
    return digits;
  }

  return null;
}

function buildMensagemWhatsApp(input: {
  motoristaNome?: string | null;
  placa: string;
  url: string;
}): string {
  const primeiroNome = input.motoristaNome?.trim().split(/\s+/)[0];
  const saudacao = primeiroNome ? `Olá ${primeiroNome}!` : 'Olá!';

  return `${saudacao} Aqui está o link para acompanhar o status do recebimento do veículo ${input.placa}: ${input.url}`;
}

function buildWhatsAppUrl(telefone: string, mensagem: string): string {
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}

export function ModalLinkRastreio({
  open,
  onClose,
  preRecebimentoId,
  placa,
  motoristaNome,
  motoristaTelefone,
}: ModalLinkRastreioProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const telefoneWhatsApp = useMemo(
    () => normalizeTelefoneWhatsApp(motoristaTelefone),
    [motoristaTelefone],
  );

  const podeEnviarWhatsApp = Boolean(url && telefoneWhatsApp);

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

  const handleEnviarWhatsApp = useCallback(() => {
    if (!url || !telefoneWhatsApp) {
      return;
    }

    const mensagem = buildMensagemWhatsApp({ motoristaNome, placa, url });
    const waUrl = buildWhatsAppUrl(telefoneWhatsApp, mensagem);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }, [motoristaNome, placa, telefoneWhatsApp, url]);

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
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
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
            <Button
              type="button"
              disabled={!podeEnviarWhatsApp || isLoading}
              title={
                telefoneWhatsApp
                  ? 'Abrir WhatsApp com o link de rastreio'
                  : 'Telefone do motorista não informado'
              }
              className="bg-[#25D366] text-white hover:bg-[#20BD5A] disabled:bg-muted disabled:text-muted-foreground"
              onClick={handleEnviarWhatsApp}
            >
              <MessageCircle className="size-4" aria-hidden />
              Enviar WhatsApp
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
