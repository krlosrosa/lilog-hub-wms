import { cn } from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import { AlertTriangle, CheckCircle, ChevronLeft, GitCompareArrows, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConflictResolutionPanel } from '../components/conflict-resolution-panel';
import { useConflictV2 } from '../hooks/use-conflict-v2';

interface ConflitoV2ViewProps {
  demandId: string;
}

export function ConflitoV2View({ demandId }: ConflitoV2ViewProps) {
  const { conflicts, isLoading, acceptServer, keepLocal } = useConflictV2(demandId);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  async function handleAcceptServer(conflictId: string) {
    setResolvingId(conflictId);
    try {
      await acceptServer(conflictId);
      toast.success('Estado do servidor aplicado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao resolver conflito');
    } finally {
      setResolvingId(null);
    }
  }

  async function handleKeepLocal(conflictId: string) {
    setResolvingId(conflictId);
    try {
      await keepLocal(conflictId);
      toast.success('Mantendo estado local — será reenviado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao resolver conflito');
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="page-enter flex flex-col pb-safe-offset-4">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-outline-variant/60 bg-surface/95 backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
        <div className="flex items-center gap-3 px-margin-mobile py-3">
          <Link
            to="/recebimento-v2/$id/resumo"
            params={{ id: demandId }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation transition-transform active:scale-90"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-headline-sm font-bold text-on-surface">Conflitos</h1>
            <p className="text-label-sm text-muted-foreground">
              {conflicts.length} pendente(s)
            </p>
          </div>
          <GitCompareArrows className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
      </div>

      <div className="mt-4 space-y-4 px-margin-mobile">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && conflicts.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/15">
              <CheckCircle className="h-8 w-8 text-secondary" aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="text-body-md font-semibold text-on-surface">
                Nenhum conflito pendente
              </p>
              <p className="text-body-sm text-muted-foreground">
                Todos os dados estão sincronizados
              </p>
            </div>
            <Link
              to="/recebimento-v2/$id/resumo"
              params={{ id: demandId }}
              className="mt-2 rounded-lg bg-secondary px-5 py-2.5 text-label-md font-semibold text-on-secondary"
            >
              Voltar ao resumo
            </Link>
          </div>
        )}

        {/* Conflict explanation */}
        {!isLoading && conflicts.length > 0 && (
          <div className="flex items-start gap-2.5 rounded-lg border border-outline-variant bg-surface-container/50 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
            <p className="text-body-sm text-on-surface-variant">
              Conflitos ocorrem quando o servidor e o dispositivo fizeram alterações diferentes no
              mesmo registro. Escolha qual versão manter.
            </p>
          </div>
        )}

        {/* Conflict panels */}
        {conflicts.map((conflict) => (
          <ConflictResolutionPanel
            key={conflict.id}
            conflict={conflict}
            onAcceptServer={handleAcceptServer}
            onKeepLocal={handleKeepLocal}
            isResolving={resolvingId === conflict.id}
          />
        ))}
      </div>
    </div>
  );
}
