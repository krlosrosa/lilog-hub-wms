'use client';

import { Button } from '@lilog/ui';
import { Loader2, Play, Square, XCircle } from 'lucide-react';

import type { SessaoApi } from '@/features/sessao-operacao/types/sessao.api';

type SessaoAcoesBarProps = {
  sessao: SessaoApi;
  isSubmitting: boolean;
  pendentesCount: number;
  onAbrir: () => void;
  onEncerrar: () => void;
  onCancelar: () => void;
};

export function SessaoAcoesBar({
  sessao,
  isSubmitting,
  pendentesCount,
  onAbrir,
  onEncerrar,
  onCancelar,
}: SessaoAcoesBarProps) {
  if (sessao.status === 'encerrada' || sessao.status === 'cancelada') {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 border-t border-outline-variant pt-4">
      {sessao.status === 'planejada' && (
        <>
          <Button
            type="button"
            onClick={onAbrir}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Play className="size-4" aria-hidden />
            )}
            Abrir sessão
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancelar}
            disabled={isSubmitting}
            className="gap-2"
          >
            <XCircle className="size-4" aria-hidden />
            Cancelar
          </Button>
        </>
      )}
      {sessao.status === 'aberta' && (
        <>
          {pendentesCount > 0 ? (
            <p className="w-full text-body-sm text-amber-700 dark:text-amber-400">
              Marque a presença de todos os funcionários antes de encerrar (
              {pendentesCount} pendente{pendentesCount === 1 ? '' : 's'}).
            </p>
          ) : null}
          <Button
            type="button"
            onClick={onEncerrar}
            disabled={isSubmitting || pendentesCount > 0}
            className="gap-2"
          >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Square className="size-4" aria-hidden />
          )}
          Encerrar sessão
        </Button>
        </>
      )}
    </div>
  );
}
