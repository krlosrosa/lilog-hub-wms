import { Button, cn } from '@lilog/ui';
import { Link, useParams } from '@tanstack/react-router';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  MapPin,
  PackageSearch,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { hapticLight } from '@/lib/haptics';

import { RecuperacaoConfirmarFinalizacaoSheet } from '../components/recuperacao-confirmar-finalizacao-sheet';
import { RecuperacaoExecucaoFormPanel } from '../components/recuperacao-execucao-form';
import {
  useDetalheRecuperacao,
  type DetalheRecuperacaoToast,
} from '../hooks/use-detalhe-recuperacao';
import type { RecuperacaoFoto } from '../types/recuperacao.schema';

function DetalheToastPortal({ toast }: { toast: DetalheRecuperacaoToast | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+16px)] z-[60] flex justify-center px-margin-mobile transition-opacity duration-300',
        toast ? 'opacity-100' : 'opacity-0',
      )}
      aria-live="polite"
    >
      <div
        className={cn(
          'rounded-lg px-4 py-3 text-body-sm font-medium shadow-lg',
          toast?.variant === 'error'
            ? 'bg-destructive text-destructive-foreground'
            : 'bg-secondary-container text-on-secondary-container',
        )}
      >
        {toast?.message ?? ''}
      </div>
    </div>,
    document.body,
  );
}

function DetalheActionBarPortal({
  canFinalizar,
  isSubmitting,
  isConcluido,
  onFinalizar,
}: {
  canFinalizar: boolean;
  isSubmitting: boolean;
  isConcluido: boolean;
  onFinalizar: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || isConcluido) return null;

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-surface/90 px-margin-mobile pt-2 backdrop-blur-md pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
      <Button
        type="button"
        disabled={!canFinalizar || isSubmitting}
        onClick={onFinalizar}
        className={cn(
          'flex h-11 w-full items-center justify-center gap-2 rounded-lg text-body-md font-semibold transition-transform touch-manipulation active:scale-95',
          canFinalizar && !isSubmitting
            ? 'bg-secondary text-on-secondary shadow-lg'
            : 'bg-muted text-muted-foreground opacity-60',
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Finalizando…
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4" aria-hidden />
            Finalizar Recuperação
          </>
        )}
      </Button>
    </div>,
    document.body,
  );
}

function PhotoLightboxPortal({
  foto,
  onClose,
}: {
  foto: RecuperacaoFoto | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !foto) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-primary/95"
      role="dialog"
      aria-modal="true"
      aria-label={`Foto: ${foto.label}`}
    >
      <div className="flex items-center justify-between px-margin-mobile pb-2 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
        <span className="text-body-sm font-semibold text-primary-foreground">
          {foto.label}
        </span>
        <button
          type="button"
          onClick={() => {
            hapticLight();
            onClose();
          }}
          aria-label="Fechar"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container/20 text-primary-foreground touch-manipulation active:scale-90"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          hapticLight();
          onClose();
        }}
        className="flex min-h-0 flex-1 items-center justify-center p-4 touch-manipulation"
        aria-label="Fechar visualização"
      >
        <img
          src={foto.url}
          alt={foto.label}
          className="max-h-full max-w-full rounded-lg object-contain"
        />
      </button>
    </div>,
    document.body,
  );
}

export function DetalheRecuperacaoView() {
  const { demandaId, itemId } = useParams({
    from: '/estoque/recuperacao/$demandaId/$itemId/detalhe',
  });
  const { state, actions } = useDetalheRecuperacao(demandaId, itemId);
  const {
    item,
    canFinalizar,
    isConcluido,
    isSubmitting,
    toast,
    photos,
    errors,
    qtyMaxima,
    qtyAvariada,
    qtyRecuperada,
    observacao,
  } = state;
  const [fotoAberta, setFotoAberta] = useState<RecuperacaoFoto | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleAbrirConfirmacao() {
    hapticLight();
    const valid = await actions.validateForm();
    if (valid) setConfirmOpen(true);
  }

  const bottomPad = isConcluido
    ? 'pb-4'
    : 'pb-[calc(72px+env(safe-area-inset-bottom,0px))]';

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-8 py-24 text-center">
        <PackageSearch className="h-8 w-8 text-outline" aria-hidden />
        <p className="text-headline-md font-semibold text-on-surface">
          Item não encontrado
        </p>
        <Link
          to="/estoque/recuperacao/$demandaId"
          params={{ demandaId }}
          onPointerDown={() => hapticLight()}
          className="text-secondary underline"
        >
          Voltar aos itens
        </Link>
      </div>
    );
  }

  return (
    <>
      <DetalheToastPortal toast={toast} />
      <DetalheActionBarPortal
        canFinalizar={canFinalizar}
        isSubmitting={isSubmitting}
        isConcluido={isConcluido}
        onFinalizar={() => void handleAbrirConfirmacao()}
      />
      <RecuperacaoConfirmarFinalizacaoSheet
        open={confirmOpen}
        sku={item.sku}
        nome={item.nome}
        qtyAvariada={qtyAvariada}
        qtyRecuperada={qtyRecuperada}
        observacao={observacao?.trim() || undefined}
        fotosCount={photos.length}
        isSubmitting={isSubmitting}
        onOpenChange={setConfirmOpen}
        onConfirmar={() => void actions.finalizarRecuperacao()}
      />
      <PhotoLightboxPortal
        foto={fotoAberta}
        onClose={() => setFotoAberta(null)}
      />

      <div className={cn('page-enter flex flex-col', bottomPad)}>
        <div className="sticky top-0 z-30 border-b border-outline-variant/60 bg-background/95 backdrop-blur-md">
          <div className="flex h-12 items-center gap-2 px-margin-mobile">
            <Link
              to="/estoque/recuperacao/$demandaId"
              params={{ demandaId }}
              aria-label="Voltar"
              onPointerDown={() => hapticLight()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation active:scale-90"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-label-md font-bold text-secondary">
                {item.sku}
              </p>
              <p className="truncate text-label-sm text-on-surface">
                {item.nome}
              </p>
            </div>
            {isConcluido && (
              <span className="shrink-0 rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-semibold text-on-secondary-container">
                OK
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2 px-margin-mobile pt-2">
          <section className="rounded-lg border border-outline-variant bg-surface p-3">
            <RecuperacaoExecucaoFormPanel
              register={actions.register}
              watch={actions.watch}
              setValue={actions.setValue}
              errors={errors}
              qtyMaxima={qtyMaxima}
              photos={photos}
              disabled={isConcluido}
              rootError={errors.root?.message}
              onCapture={actions.capture}
              onRemovePhoto={actions.removePhoto}
              hiddenInput={actions.hiddenInput}
            />
          </section>

          <article className="rounded-lg border border-outline-variant bg-surface px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-label-sm">
              <span className="inline-flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
                {item.motivoAvaria}
              </span>
              <span className="inline-flex items-center gap-1 text-on-surface-variant">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                <span className="font-mono text-on-surface">
                  {item.enderecoEsperado}
                </span>
              </span>
              {item.lote && (
                <span className="text-on-surface-variant">
                  Lote{' '}
                  <span className="font-mono font-semibold text-on-surface">
                    {item.lote}
                  </span>
                </span>
              )}
              {item.validade && (
                <span className="text-on-surface-variant">
                  Val.{' '}
                  <span className="font-mono font-semibold text-on-surface">
                    {item.validade}
                  </span>
                </span>
              )}
              {item.temperatura && (
                <span className="rounded-full bg-secondary-container px-1.5 py-px text-[10px] font-medium text-on-secondary-container">
                  {item.temperatura}
                </span>
              )}
            </div>
            {item.descricaoAvaria && (
              <p className="mt-1.5 line-clamp-2 text-label-sm italic text-on-surface-variant">
                {item.descricaoAvaria}
              </p>
            )}
          </article>

          {item.fotosAntes.length > 0 && (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {item.fotosAntes.map((foto) => (
                <button
                  key={foto.id}
                  type="button"
                  onClick={() => {
                    hapticLight();
                    setFotoAberta(foto);
                  }}
                  className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-outline-variant touch-manipulation active:scale-95"
                  aria-label={`Ver ${foto.label}`}
                >
                  <img
                    src={foto.url}
                    alt={foto.label}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
