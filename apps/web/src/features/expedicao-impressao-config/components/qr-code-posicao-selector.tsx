'use client';

import { cn } from '@lilog/ui';
import { QrCode } from 'lucide-react';

import { fieldInputClassName, sectionLabelClassName } from '@/features/expedicao-impressao-config/components/panel-styles';
import {
  POSICAO_QR_CODE_LABELS,
  type PosicaoQrCode,
} from '@/features/expedicao-impressao-config/types/impressao-config.schema';

const POSICOES_CANTO: PosicaoQrCode[] = [
  'superior_esquerdo',
  'superior_direito',
  'inferior_esquerdo',
  'inferior_direito',
];

type QrCodePosicaoSelectorProps = {
  posicao: PosicaoQrCode;
  tamanho: number;
  onMudarPosicao: (posicao: PosicaoQrCode) => void;
  onMudarTamanho: (tamanho: number) => void;
};

function celulaAtiva(posicao: PosicaoQrCode, alvo: PosicaoQrCode) {
  return posicao === alvo;
}

export function QrCodePosicaoSelector({
  posicao,
  tamanho,
  onMudarPosicao,
  onMudarTamanho,
}: QrCodePosicaoSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className={sectionLabelClassName}>Posição do QR Code</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          O QR Code é obrigatório em todos os mapas. Escolha um canto fixo ou
          posicione manualmente com a variável{' '}
          <code className="rounded bg-primary/8 px-1 font-mono text-[10px] text-primary">
            {'{{qr_code}}'}
          </code>{' '}
          no HTML.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative mx-auto w-full max-w-[200px] rounded-lg border border-outline-variant bg-white p-3 shadow-sm sm:mx-0">
          <div className="mb-2 text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            Mapa
          </div>
          <div className="relative aspect-[4/3] rounded border border-dashed border-zinc-300 bg-zinc-50">
            <div className="absolute inset-2 rounded bg-zinc-100/80" />
            {POSICOES_CANTO.map((canto) => {
              const ativo = celulaAtiva(posicao, canto);

              return (
                <button
                  key={canto}
                  type="button"
                  onClick={() => onMudarPosicao(canto)}
                  aria-pressed={ativo}
                  aria-label={POSICAO_QR_CODE_LABELS[canto]}
                  className={cn(
                    'absolute flex size-8 items-center justify-center rounded border transition-colors',
                    canto === 'superior_esquerdo' && 'left-1 top-1',
                    canto === 'superior_direito' && 'right-1 top-1',
                    canto === 'inferior_esquerdo' && 'bottom-1 left-1',
                    canto === 'inferior_direito' && 'bottom-1 right-1',
                    ativo
                      ? 'border-primary bg-primary/15 text-primary shadow-sm'
                      : 'border-zinc-300 bg-white text-zinc-400 hover:border-primary/40 hover:text-primary',
                  )}
                >
                  <QrCode className="size-3.5" aria-hidden />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <button
            type="button"
            onClick={() => onMudarPosicao('no_html')}
            aria-pressed={posicao === 'no_html'}
            className={cn(
              'w-full rounded-md border px-3 py-2 text-left transition-colors',
              posicao === 'no_html'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-outline-variant bg-surface-low/30 text-foreground hover:border-primary/40',
            )}
          >
            <p className="text-xs font-semibold">
              {POSICAO_QR_CODE_LABELS.no_html}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Insira{' '}
              <code className="font-mono text-[10px]">{'{{qr_code}}'}</code> no
              template HTML onde o QR deve aparecer.
            </p>
          </button>

          <div>
            <label
              htmlFor="qr-tamanho"
              className={cn(sectionLabelClassName, 'mb-1 block')}
            >
              Tamanho (px)
            </label>
            <input
              id="qr-tamanho"
              type="number"
              min={48}
              max={160}
              step={4}
              value={tamanho}
              onChange={(event) => onMudarTamanho(Number(event.target.value))}
              className={cn(fieldInputClassName, 'max-w-[120px] font-mono')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function classesPosicaoQrCode(posicao: PosicaoQrCode): string {
  switch (posicao) {
    case 'superior_esquerdo':
      return 'left-0 top-0';
    case 'superior_direito':
      return 'right-0 top-0';
    case 'inferior_esquerdo':
      return 'bottom-0 left-0';
    case 'inferior_direito':
      return 'bottom-0 right-0';
    default:
      return '';
  }
}
