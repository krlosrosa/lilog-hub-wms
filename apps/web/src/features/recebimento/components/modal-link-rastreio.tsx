'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@lilog/ui';
import {
  Check,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  MessageCircle,
  PhoneOff,
  RefreshCw,
  Truck,
} from 'lucide-react';
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

  const motoristaLabel = motoristaNome?.trim() || null;

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

  const isBusy = isLoading || isRegenerating;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[420px]">
        <DialogHeader className="space-y-3 border-b border-outline-variant px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Link2 className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-base leading-tight">
                Link do motorista
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">
                Compartilhe o acompanhamento em tempo real. Acesso público, sem login.
              </DialogDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md border border-outline-variant bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground">
              <Truck className="size-3 text-muted-foreground" aria-hidden />
              {placa}
            </span>
            {motoristaLabel ? (
              <span className="inline-flex max-w-[200px] truncate rounded-md border border-outline-variant bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                {motoristaLabel}
              </span>
            ) : null}
          </div>
        </DialogHeader>

        <div className="px-5 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
              <p className="text-xs text-muted-foreground">Gerando link…</p>
            </div>
          ) : error ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                {error}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full text-xs"
                onClick={() => void carregarLink(false)}
              >
                Tentar novamente
              </Button>
            </div>
          ) : url ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <QrCodePreview
                  value={url}
                  qrSize={128}
                  title="QR code de rastreio"
                  className="rounded-none p-1"
                />
                <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Escaneie ou copie
                  </p>
                  <div className="flex items-stretch gap-1.5">
                    <div className="relative min-w-0 flex-1">
                      <input
                        type="text"
                        readOnly
                        value={url}
                        aria-label="Link de rastreio"
                        className="h-8 w-full truncate rounded-md border border-outline-variant bg-muted/30 px-2.5 pr-7 text-[11px] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        onFocus={(event) => event.target.select()}
                      />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                        title="Abrir link"
                        aria-label="Abrir link em nova aba"
                      >
                        <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 px-2.5"
                      onClick={() => void handleCopy()}
                      aria-label={copied ? 'Link copiado' : 'Copiar link'}
                    >
                      {copied ? (
                        <Check className="size-3.5 text-green-600" aria-hidden />
                      ) : (
                        <Copy className="size-3.5" aria-hidden />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {telefoneWhatsApp ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isBusy}
                    className="h-8 w-full gap-1.5 bg-[#25D366] text-xs text-white hover:bg-[#20BD5A]"
                    onClick={handleEnviarWhatsApp}
                  >
                    <MessageCircle className="size-3.5" aria-hidden />
                    Enviar WhatsApp
                  </Button>
                ) : (
                  <>
                    <div className="flex flex-1 items-center gap-1.5 rounded-md border border-dashed border-outline-variant px-2.5 py-1.5 text-[11px] text-muted-foreground">
                      <PhoneOff className="size-3 shrink-0" aria-hidden />
                      <span>Telefone não informado</span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isBusy}
                      className="h-8 shrink-0 gap-1.5 px-3 text-xs"
                      onClick={() => void handleCopy()}
                    >
                      {copied ? (
                        <>
                          <Check className="size-3.5" aria-hidden />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" aria-hidden />
                          Copiar
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {url && !error ? (
          <div className="flex items-center justify-between border-t border-outline-variant px-5 py-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isBusy}
              className="h-7 gap-1.5 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              onClick={() => void carregarLink(true)}
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                  Regenerando…
                </>
              ) : (
                <>
                  <RefreshCw className="size-3" aria-hidden />
                  Gerar novo link
                </>
              )}
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Invalida o link anterior
            </p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
