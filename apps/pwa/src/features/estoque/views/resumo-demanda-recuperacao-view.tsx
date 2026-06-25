import { Button, cn } from '@lilog/ui';
import { Link, useParams } from '@tanstack/react-router';
import {
  CheckCircle,
  ChevronRight,
  Printer,
  Timer,
  Warehouse,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { RecuperacaoPhotoComparison } from '../components/recuperacao-photo-comparison';
import { RecuperacaoResumoMetrics } from '../components/recuperacao-resumo-metrics';
import {
  useResumoDemandaRecuperacao,
  type ResumoRecuperacaoToast,
} from '../hooks/use-resumo-demanda-recuperacao';

function ResumoToastPortal({ toast }: { toast: ResumoRecuperacaoToast | null }) {
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
      <div className="rounded-lg bg-secondary-container px-4 py-3 text-body-sm font-medium text-on-secondary-container shadow-lg">
        {toast?.message ?? ''}
      </div>
    </div>,
    document.body,
  );
}

export function ResumoDemandaRecuperacaoView() {
  const { demandaId } = useParams({
    from: '/estoque/recuperacao/$demandaId/resumo',
  });
  const { state, actions } = useResumoDemandaRecuperacao(demandaId);
  const { demanda, resumo, toast } = state;

  if (!demanda || !resumo) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
        <p className="text-headline-md font-semibold text-on-surface">
          Resumo não disponível
        </p>
        <Link
          to="/estoque/recuperacao"
          className="text-secondary underline"
        >
          Voltar à lista
        </Link>
      </div>
    );
  }

  return (
    <>
      <ResumoToastPortal toast={toast} />

      <div className="page-enter flex min-h-screen flex-col pb-8">
        <div className="sticky top-0 z-30 border-b border-outline-variant bg-surface">
          <div className="flex h-16 items-center justify-between px-margin-mobile">
            <div className="flex items-center gap-3">
              <Warehouse className="h-5 w-5 text-secondary" aria-hidden />
              <h1 className="text-headline-md font-bold text-on-surface">
                WMS Terminal
              </h1>
            </div>
          </div>
        </div>

        <main className="mx-auto w-full max-w-5xl px-margin-mobile pt-6">
          <section className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary-container shadow-sm">
              <CheckCircle
                className="h-10 w-10 text-on-secondary-container"
                aria-hidden
              />
            </div>
            <h2 className="mb-1 text-headline-lg-mobile font-semibold text-on-surface md:text-headline-lg">
              Resumo da Demanda #{demanda.id}
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Operação concluída com sucesso no setor de triagem.
            </p>
          </section>

          <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <RecuperacaoResumoMetrics resumo={resumo} />

            <div className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-low p-6">
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Timer className="h-5 w-5 text-secondary" aria-hidden />
                  <h3 className="text-label-md font-semibold uppercase tracking-wider text-on-surface-variant">
                    Operação
                  </h3>
                </div>
                <div className="flex items-start gap-3">
                  <div>
                    <p className="text-label-sm text-on-surface-variant">
                      Tempo gasto
                    </p>
                    <p className="text-body-md font-semibold text-on-surface">
                      {resumo.tempoGastoMinutos} min
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 border-t border-outline-variant/30 pt-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-secondary" aria-hidden />
                  <span className="text-body-sm italic text-on-surface-variant">
                    ID: {demanda.id}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <RecuperacaoPhotoComparison
            fotoAntesUrl={resumo.fotoAntesUrl}
            fotoDepoisUrl={resumo.fotoDepoisUrl}
          />

          <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
            <Button
              type="button"
              onClick={actions.voltarParaLista}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-secondary px-8 text-on-secondary md:w-auto"
            >
              Voltar para Lista
              <ChevronRight className="h-5 w-5" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={actions.imprimirEtiqueta}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-outline px-8 md:w-auto"
            >
              <Printer className="h-5 w-5" aria-hidden />
              Imprimir Etiqueta
            </Button>
          </div>
        </main>
      </div>
    </>
  );
}
