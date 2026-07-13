'use client';

import { cn } from '@lilog/ui';
import {
  AlertTriangle,
  Loader2,
  Unlock,
  User,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useImpedimentoDetalhe } from '@/features/gestao-recursos-recebimento/hooks/use-impedimento-detalhe';
import type { DemandaRecebimentoRecursoApi } from '@/features/gestao-recursos-recebimento/types/recebimento-recursos.api';

type ImpedimentoDetalheSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  demanda: DemandaRecebimentoRecursoApi | null;
  onLiberar?: (preRecebimentoId: string) => Promise<void>;
  isLiberando?: boolean;
};

function FotoEvidencia({
  id,
  url,
  legenda,
  onExpand,
}: {
  id: string;
  url: string;
  legenda: string;
  onExpand: (url: string, legenda: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onExpand(url, legenda)}
      className="group relative aspect-square overflow-hidden rounded-xl border border-outline-variant bg-surface-container"
    >
      <img
        src={url}
        alt={legenda}
        className="h-full w-full object-cover transition-transform group-active:scale-95"
        loading="lazy"
      />
      <span className="absolute inset-x-0 bottom-0 bg-scrim/60 px-2 py-1 text-[10px] font-medium text-on-primary">
        {legenda}
      </span>
    </button>
  );
}

export function ImpedimentoDetalheSheet({
  isOpen,
  onClose,
  demanda,
  onLiberar,
  isLiberando,
}: ImpedimentoDetalheSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const preRecebimentoId = demanda?.preRecebimentoId ?? null;
  const { detalhe, isLoading, error, reload } = useImpedimentoDetalhe(
    preRecebimentoId,
    isOpen,
  );
  const [fotoExpandida, setFotoExpandida] = useState<{
    url: string;
    legenda: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFotoExpandida(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (fotoExpandida) {
          setFotoExpandida(null);
          return;
        }
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, fotoExpandida]);

  if (!isOpen || !demanda) return null;

  const registradoPor =
    detalhe?.registradoPorNome ??
    (detalhe?.registradoPorMatricula
      ? `Mat. ${detalhe.registradoPorMatricula}`
      : null);

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 bg-scrim/50"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal
        aria-label="Detalhes do impedimento"
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-2xl bg-surface shadow-lg"
      >
        <div className="flex justify-center pt-2.5" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-outline-variant/60" />
        </div>

        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-orange-600" aria-hidden />
            <div className="min-w-0">
              <h2 className="truncate text-title-sm font-semibold text-on-surface">
                Impedimento na conferência
              </h2>
              <p className="truncate text-[11px] text-on-surface-variant">
                {demanda.placa ?? 'Placa não informada'}
                {demanda.transportadoraNome ? ` · ${demanda.transportadoraNome}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1 text-on-surface-variant hover:bg-surface-container active:bg-surface-container-high"
            aria-label="Fechar"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="size-8 animate-spin text-orange-600" aria-hidden />
              <p className="text-label-sm text-on-surface-variant">
                Carregando detalhes...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-error/25 bg-error-container/20 px-3 py-4 text-center">
              <p className="text-label-sm font-semibold text-error">{error}</p>
              <button
                type="button"
                onClick={() => void reload()}
                className="mt-2 text-label-sm font-semibold text-error underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : detalhe ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-orange-500/25 bg-orange-500/10 p-3.5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">
                    Motivo
                  </span>
                  <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                    {detalhe.tipoLabel}
                  </span>
                </div>
                <p className="text-body-md leading-relaxed text-on-surface">
                  {detalhe.descricao}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-on-surface-variant">
                {registradoPor ? (
                  <span className="inline-flex items-center gap-1">
                    <User className="size-3.5" aria-hidden />
                    {registradoPor}
                    {detalhe.registradoPorNome && detalhe.registradoPorMatricula
                      ? ` · Mat. ${detalhe.registradoPorMatricula}`
                      : null}
                  </span>
                ) : null}
                <span>Registrado em {detalhe.registradoEm}</span>
              </div>

              <div>
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Fotos do impedimento
                </h3>
                {detalhe.fotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {detalhe.fotos.map((foto) => (
                      <FotoEvidencia
                        key={foto.id}
                        id={foto.id}
                        url={foto.url}
                        legenda={foto.legenda}
                        onExpand={(url, legenda) => setFotoExpandida({ url, legenda })}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-orange-500/25 bg-orange-500/5 px-3 py-4 text-center text-label-sm text-on-surface-variant">
                    {detalhe.photoCount > 0
                      ? `${detalhe.photoCount} foto(s) aguardando sincronização`
                      : 'Nenhuma foto do impedimento disponível'}
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {onLiberar && demanda.statusDemanda === 'impedido' ? (
          <div className="border-t border-outline-variant px-4 py-3">
            <button
              type="button"
              disabled={isLiberando || isLoading}
              onClick={() => void onLiberar(demanda.preRecebimentoId)}
              className={cn(
                'flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-500 py-3 text-label-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50 active:opacity-80',
              )}
            >
              <Unlock className="size-4" aria-hidden />
              {isLiberando ? 'Liberando...' : 'Liberar para conferência'}
            </button>
          </div>
        ) : null}

        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>

      {fotoExpandida ? (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-scrim/90"
          role="dialog"
          aria-label={fotoExpandida.legenda}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-label-sm font-medium text-on-primary">
              {fotoExpandida.legenda}
            </p>
            <button
              type="button"
              onClick={() => setFotoExpandida(null)}
              className="rounded-full p-1.5 text-on-primary/80 hover:bg-on-primary/10"
              aria-label="Fechar foto"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center p-4">
            <img
              src={fotoExpandida.url}
              alt={fotoExpandida.legenda}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
