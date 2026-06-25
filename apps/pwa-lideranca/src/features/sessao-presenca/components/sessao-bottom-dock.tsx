import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  cn,
} from '@lilog/ui';
import { DoorOpen, Loader2, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { hapticMedium } from '@/lib/haptics';

import type { SessaoTrabalhoStatusApi } from '../types';

export interface SessaoBottomDockProps {
  status: SessaoTrabalhoStatusApi | null;
  isSubmitting: boolean;
  pendentesCount: number;
  onAbrir: () => void;
  onEncerrar: () => void;
}

export function SessaoBottomDock({
  status,
  isSubmitting,
  pendentesCount,
  onAbrir,
  onEncerrar,
}: SessaoBottomDockProps) {
  const [mounted, setMounted] = useState(false);
  const [confirmEncerrar, setConfirmEncerrar] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!status || status === 'encerrada' || status === 'cancelada') {
    return null;
  }

  const isAberta = status === 'aberta';
  const podeEncerrar = isAberta && pendentesCount === 0;

  const dock = (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 w-full pb-safe">
      <div className="pointer-events-auto border-t border-outline-variant bg-surface/95 px-margin-mobile pt-3 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-surface/90">
        {isAberta && pendentesCount > 0 && !isSubmitting ? (
          <p className="mb-2 text-center text-label-sm text-warning">
            Marque a presença de todos os funcionários antes de encerrar (
            {pendentesCount} pendente{pendentesCount === 1 ? '' : 's'})
          </p>
        ) : null}
        <Button
          type="button"
          onClick={() => {
            hapticMedium();
            if (isAberta) {
              if (podeEncerrar) {
                setConfirmEncerrar(true);
              }
            } else {
              void onAbrir();
            }
          }}
          disabled={isSubmitting || (isAberta && !podeEncerrar)}
          className={cn(
            'flex h-12 w-full items-center justify-center gap-2 rounded-lg text-label-md font-semibold touch-manipulation transition-transform active:scale-[0.98]',
            isAberta
              ? 'bg-surface-container-high text-on-surface hover:bg-surface-container-high/90'
              : 'bg-secondary text-on-secondary hover:bg-secondary/90',
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Processando...
            </>
          ) : isAberta ? (
            <>
              <Lock className="h-5 w-5" aria-hidden />
              Encerrar sessão
            </>
          ) : (
            <>
              <DoorOpen className="h-5 w-5" aria-hidden />
              Abrir sessão
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (!mounted) return null;

  return (
    <>
      {createPortal(dock, document.body)}
      <AlertDialog open={confirmEncerrar} onOpenChange={setConfirmEncerrar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              A sessão será finalizada e não será possível alterar presenças
              depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmEncerrar(false);
                void onEncerrar();
              }}
            >
              Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
