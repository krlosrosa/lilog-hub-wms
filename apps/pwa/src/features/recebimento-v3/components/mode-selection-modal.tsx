import { cn } from '@lilog/ui';
import { Loader2, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';

import { hapticMedium } from '@/lib/haptics';

import type { BootstrapProgress } from '@/features/recebimento-v2/types/recebimento-v2.schema';

import type { ConferenceMode } from '../types/conference-mode';
import { isBrowserOnline } from '../lib/network';
import { OfflineBootstrapProgress } from './offline-bootstrap-progress';

interface ModeSelectionModalProps {
  open: boolean;
  demandId: string;
  unidadeId?: string;
  onSelect: (mode: ConferenceMode) => void;
  onPrepareOffline: (demandId: string, unidadeId: string) => Promise<void>;
  offlineProgress: BootstrapProgress | null;
  isPreparingOffline: boolean;
}

export function ModeSelectionModal({
  open,
  demandId,
  unidadeId,
  onSelect,
  onPrepareOffline,
  offlineProgress,
  isPreparingOffline,
}: ModeSelectionModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  if (!open) return null;

  const handleSelectOnline = async () => {
    setError(null);
    setIsSelecting(true);

    try {
      if (!isBrowserOnline()) {
        setError('Não há conexão com a internet. Escolha o modo Offline ou conecte-se à rede.');
        return;
      }

      hapticMedium();
      onSelect('online');
    } finally {
      setIsSelecting(false);
    }
  };

  const handleSelectOffline = async () => {
    setError(null);
    setIsSelecting(true);

    try {
      if (!isBrowserOnline()) {
        setError(
          'É necessário conexão com a internet para baixar os dados da demanda antes do modo offline.',
        );
        return;
      }

      if (!unidadeId) {
        setError('Selecione uma unidade antes de iniciar a conferência offline.');
        return;
      }

      hapticMedium();
      await onPrepareOffline(demandId, unidadeId);
      onSelect('offline');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível baixar os dados da demanda. Tente novamente.',
      );
    } finally {
      setIsSelecting(false);
    }
  };

  const busy = isSelecting || isPreparingOffline;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-scrim/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="mode-selection-title"
        className="w-full max-w-md rounded-xl border border-outline-variant bg-surface p-5 shadow-lg"
      >
        <h2 id="mode-selection-title" className="text-title-md text-on-surface">
          Como deseja executar esta conferência?
        </h2>
        <p className="mt-2 text-body-sm text-on-surface-variant">
          A escolha ficará associada à sessão desta demanda.
        </p>

        {isPreparingOffline ? (
          <div className="mt-5">
            <OfflineBootstrapProgress progress={offlineProgress} />
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSelectOnline()}
              className={cn(
                'flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-left transition-colors touch-manipulation active:scale-[0.99]',
                'hover:border-primary/40',
              )}
            >
              <div className="rounded-lg bg-primary-container p-2 text-on-primary-container">
                <Wifi className="h-5 w-5" />
              </div>
              <div>
                <p className="text-title-sm text-on-surface">Modo Online</p>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  Internet obrigatória. Leituras e fotos são enviadas imediatamente para a API.
                </p>
              </div>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSelectOffline()}
              className={cn(
                'flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 text-left transition-colors touch-manipulation active:scale-[0.99]',
                'hover:border-secondary/40',
              )}
            >
              <div className="rounded-lg bg-secondary-container p-2 text-on-secondary-container">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-title-sm text-on-surface">Modo Offline</p>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  Baixa checklist, itens, conferências, avarias e catálogo agora. Depois, tudo
                  acontece localmente até a finalização.
                </p>
              </div>
            </button>
          </div>
        )}

        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-body-sm text-destructive">
            <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {busy && !isPreparingOffline ? (
          <div className="mt-4 flex items-center gap-2 text-body-sm text-on-surface-variant">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparando sessão...
          </div>
        ) : null}
      </div>
    </div>
  );
}
