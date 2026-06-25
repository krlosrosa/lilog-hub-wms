'use client';

import { useEffect, useMemo, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { cn } from '@lilog/ui';

import { MapaSeparacaoQr } from '@/features/transporte/components/mapa-separacao-qr';
import { classesPosicaoQrCode } from '@/features/expedicao-impressao-config/components/qr-code-posicao-selector';
import type { PosicaoQrCode } from '@/features/expedicao-impressao-config/types/impressao-config.schema';
import {
  QR_CODE_SLOT_CLASS,
  QR_CODE_VARIAVEL,
  montarHtmlComSlotsQr,
  substituirVariaveisExemplo,
  templateContemQrCode,
} from '@/features/expedicao-impressao-config/types/layout-mapa';

const VALOR_QR_EXEMPLO = 'MAPA-EXEMPLO-123';

type CabecalhoMapaPreviewProps = {
  template: string;
  posicaoQr: PosicaoQrCode;
  tamanhoQr: number;
};

type HtmlTemplateComQrInlineProps = {
  template: string;
  tamanhoQr: number;
};

function HtmlTemplateComQrInline({
  template,
  tamanhoQr,
}: HtmlTemplateComQrInlineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootsRef = useRef<Root[]>([]);
  const html = useMemo(
    () => montarHtmlComSlotsQr(template, tamanhoQr),
    [template, tamanhoQr],
  );

  useEffect(() => {
    for (const root of rootsRef.current) {
      root.unmount();
    }
    rootsRef.current = [];

    const container = containerRef.current;
    if (!container) return;

    const slots = container.querySelectorAll(`.${QR_CODE_SLOT_CLASS}`);

    for (const slot of slots) {
      const root = createRoot(slot);
      root.render(
        <MapaSeparacaoQr
          value={VALOR_QR_EXEMPLO}
          size={tamanhoQr}
          variant="inline"
        />,
      );
      rootsRef.current.push(root);
    }

    return () => {
      for (const root of rootsRef.current) {
        root.unmount();
      }
      rootsRef.current = [];
    };
  }, [html, tamanhoQr]);

  return (
    <div
      ref={containerRef}
      className="text-zinc-900"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function CabecalhoMapaPreview({
  template,
  posicaoQr,
  tamanhoQr,
}: CabecalhoMapaPreviewProps) {
  const qrNoHtml = posicaoQr === 'no_html';
  const qrFaltando = qrNoHtml && !templateContemQrCode(template);

  if (!template.trim()) {
    return (
      <p className="text-center text-[11px] text-muted-foreground">
        Nenhum conteúdo no template. Escreva o HTML acima.
      </p>
    );
  }

  const htmlBase = qrNoHtml
    ? template
    : template.replaceAll(QR_CODE_VARIAVEL, '');

  return (
    <div className="space-y-2">
      {qrFaltando ? (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[10px] text-amber-700 dark:text-amber-400">
          QR Code obrigatório: inclua{' '}
          <code className="font-mono">{QR_CODE_VARIAVEL}</code> no template ou
          escolha uma posição fixa.
        </p>
      ) : null}

      <div className="relative min-h-[80px]">
        {qrNoHtml && templateContemQrCode(template) ? (
          <HtmlTemplateComQrInline template={template} tamanhoQr={tamanhoQr} />
        ) : (
          <div
            className="text-zinc-900"
            dangerouslySetInnerHTML={{
              __html: substituirVariaveisExemplo(htmlBase),
            }}
          />
        )}

        {!qrNoHtml ? (
          <div
            className={cn('absolute z-10', classesPosicaoQrCode(posicaoQr))}
          >
            <MapaSeparacaoQr value={VALOR_QR_EXEMPLO} size={tamanhoQr} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
