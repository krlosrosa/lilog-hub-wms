import { Link } from '@tanstack/react-router';
import { ArrowLeft, CloudUpload } from 'lucide-react';
import { RcSyncDebugPanel } from '../components/rc-sync-debug-panel';

export function SyncRcView() {
  return (
    <div className="page-enter flex min-h-0 flex-1 flex-col pb-6">
      <header className="relative overflow-hidden px-margin-mobile pt-4">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-secondary/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-6 left-1/4 h-24 w-24 rounded-full bg-primary/10 blur-2xl"
          aria-hidden
        />

        <Link
          to="/recebimento-rc"
          className="relative z-10 mb-4 inline-flex items-center gap-1.5 rounded-full border border-outline-variant/70 bg-surface/80 px-3 py-1.5 text-label-sm font-medium text-on-surface shadow-sm backdrop-blur-sm touch-manipulation active:scale-[0.98]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Voltar
        </Link>

        <div className="relative z-10 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary-container shadow-sm">
            <CloudUpload className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-headline-md font-semibold leading-tight text-on-surface">
              Central de Sync
            </h1>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Filas, divergências e recuperação do Replicache
            </p>
          </div>
        </div>
      </header>

      <div className="mt-4 px-margin-mobile">
        <RcSyncDebugPanel variant="page" defaultExpanded />
      </div>
    </div>
  );
}
