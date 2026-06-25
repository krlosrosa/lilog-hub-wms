import { Button, cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  ImagePlus,
  Info,
  Loader2,
  Send,
  AlertTriangle,
  ShieldCheck,
  ZoomIn,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { hapticLight, hapticMedium } from '@/lib/haptics';

import { DivergenciaCard } from '../components/divergencia-card';
import { SignaturePad } from '../components/signature-pad';
import { TurnoStatusHero } from '../components/turno-status-hero';
import { useResumoTurno, type ResumoTurnoToast } from '../hooks/use-resumo-turno';

function ResumoToastPortal({ toast }: { toast: ResumoTurnoToast | null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

function ResumoBottomDock({
  isSubmitting,
  protocolo,
  onFinalize,
}: {
  isSubmitting: boolean;
  protocolo: string;
  onFinalize: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 w-full pb-safe">
      <div className="pointer-events-auto border-t border-outline-variant bg-surface/95 px-margin-mobile pt-3 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-surface/90">
        <Button
          type="button"
          onClick={() => {
            hapticMedium();
            void onFinalize();
          }}
          disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-on-secondary text-label-md font-semibold touch-manipulation transition-transform active:scale-[0.98] hover:bg-secondary/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Finalizando...
            </>
          ) : (
            <>
              Finalizar passagem de turno
              <Send className="h-5 w-5" aria-hidden />
            </>
          )}
        </Button>
        <p className="mt-2 pb-1 text-center text-label-sm text-on-surface-variant">
          Protocolo: {protocolo}
        </p>
      </div>
    </div>,
    document.body,
  );
}

export function ResumoTurnoView() {
  const { state, actions } = useResumoTurno();
  const { passagem, pin, isSubmitting, toast, divergenciaCount } = state;

  return (
    <div className="page-enter flex flex-col">
      <ResumoToastPortal toast={toast} />

      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-margin-mobile">
          <Link
            to="/passagem-bastao"
            aria-label="Voltar para o checklist"
            onPointerDown={() => hapticLight()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-transform active:scale-90 touch-manipulation"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-headline-md font-semibold leading-tight text-on-surface">
              Resumo do turno
            </h1>
            <p className="truncate font-mono text-label-sm text-on-surface-variant">
              {passagem.protocolo}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-margin-mobile pb-[calc(120px+env(safe-area-inset-bottom,0px))] pt-3">
        <section className="space-y-1">
          <h2 className="text-headline-lg-mobile font-semibold text-on-surface">
            Passagem de turno
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            Revise divergências, evidências e valide com o operador receptor.
          </p>
        </section>

        <TurnoStatusHero
          percent={passagem.progressoChecklist}
          statusItens={passagem.statusItens}
          variant="accent"
        />

        <section className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
              </div>
              <h2 className="text-headline-md font-semibold text-on-surface">
                Itens não conformes
              </h2>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-label-sm font-semibold text-destructive">
              {divergenciaCount} {divergenciaCount === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <div className="space-y-2">
            {passagem.divergencias.map((divergencia) => (
              <DivergenciaCard key={divergencia.id} divergencia={divergencia} grouped />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
          <h2 className="mb-3 text-headline-md font-semibold text-on-surface">
            Evidências de turno
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {passagem.evidencias.map((evidencia) => (
              <div
                key={evidencia.id}
                className="group relative aspect-square overflow-hidden rounded-lg bg-surface-container"
              >
                <img
                  src={evidencia.url}
                  alt={evidencia.alt}
                  className="h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0 flex items-center justify-center bg-foreground/40 opacity-0 transition-opacity group-active:opacity-100"
                  aria-hidden
                >
                  <ZoomIn className="h-6 w-6 text-background" />
                </div>
              </div>
            ))}
            <button
              type="button"
              aria-label="Adicionar evidência fotográfica"
              onPointerDown={() => hapticLight()}
              className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant text-on-surface-variant transition-colors touch-manipulation active:scale-95 active:bg-surface-container"
            >
              <ImagePlus className="h-6 w-6" aria-hidden />
              <span className="mt-1 text-label-sm font-medium">Adicionar</span>
            </button>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border-2 border-secondary/20 bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
              <ShieldCheck className="h-5 w-5 text-secondary" aria-hidden />
            </div>
            <h2 className="text-headline-md font-semibold text-on-surface">
              Validação do receptor
            </h2>
          </div>

          <div className="space-y-1.5">
            <p className="text-label-md uppercase tracking-wider text-on-surface-variant">
              Assinatura digital
            </p>
            <SignaturePad onSignatureChange={actions.handleSignatureChange} />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="pin-confirmacao"
              className="text-label-md uppercase tracking-wider text-on-surface-variant"
            >
              Confirmação por senha
            </label>
            <input
              id="pin-confirmacao"
              type="password"
              value={pin}
              onChange={(event) => actions.setPin(event.target.value)}
              placeholder="Digite seu PIN ou senha"
              autoComplete="current-password"
              className="h-12 w-full rounded-lg border border-outline-variant bg-surface-bright px-4 text-body-md text-on-surface outline-none transition-colors focus:border-secondary focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
            <div className="mb-1 flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
              <span className="text-label-md font-semibold text-on-surface">
                Receptor: {passagem.operadorReceptor}
              </span>
            </div>
            <p className="text-body-sm text-on-surface-variant">
              Ao assinar ou digitar sua senha, você confirma que revisou todas as
              divergências listadas acima.
            </p>
          </div>
        </section>
      </div>

      <ResumoBottomDock
        isSubmitting={isSubmitting}
        protocolo={passagem.protocolo}
        onFinalize={actions.handleFinalize}
      />
    </div>
  );
}
