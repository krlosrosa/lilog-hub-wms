'use client';

import { useCallback, useRef } from 'react';

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { ClipboardPen, Loader2 } from 'lucide-react';

import {
  CncRegistroAnaliseSection,
  type CncRegistroAnaliseSalvarActions,
} from '@/features/cnc/components/cnc-registro-analise-section';
import type { CncDetalhe } from '@/features/cnc/types/cnc.schema';
import type { CncImpressaoOpcoes } from '@/features/cnc/types/cnc-impressao.schema';

export type CncRegistroAnaliseSheetMode = 'editar' | 'iniciar';

type CncRegistroAnaliseSheetProps = {
  open: boolean;
  mode: CncRegistroAnaliseSheetMode;
  cnc: CncDetalhe;
  podeEditar: boolean;
  processando?: boolean;
  onOpenChange: (open: boolean) => void;
  onSalvo?: (patch: Partial<CncDetalhe>) => void;
  onOpcoesChange?: (opcoes: CncImpressaoOpcoes) => void;
  onConfirmarIniciar?: () => void | Promise<void>;
};

export function CncRegistroAnaliseSheet({
  open,
  mode,
  cnc,
  podeEditar,
  processando = false,
  onOpenChange,
  onSalvo,
  onOpcoesChange,
  onConfirmarIniciar,
}: CncRegistroAnaliseSheetProps) {
  const salvarActionsRef = useRef<CncRegistroAnaliseSalvarActions | null>(null);

  const handleRegisterSalvar = useCallback(
    (actions: CncRegistroAnaliseSalvarActions) => {
      salvarActionsRef.current = actions;
    },
    [],
  );

  const handleConfirmarIniciar = useCallback(async () => {
    await salvarActionsRef.current?.salvarTudo();
    await onConfirmarIniciar?.();
  }, [onConfirmarIniciar]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (processando) {
      return;
    }

    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="shrink-0 border-b border-outline-variant bg-surface-highest/30 px-5 py-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <ClipboardPen className="size-4 text-primary" aria-hidden />
            Registro da análise
          </SheetTitle>
          <SheetDescription>
            {mode === 'iniciar'
              ? 'Preencha a observação e as opções de impressão antes de iniciar a análise.'
              : 'Observação e opções que serão usadas na impressão da CNC.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <CncRegistroAnaliseSection
            cnc={cnc}
            podeEditar={podeEditar}
            onSalvo={onSalvo}
            onOpcoesChange={onOpcoesChange}
            onRegisterSalvar={handleRegisterSalvar}
          />
        </div>

        {mode === 'iniciar' ? (
          <SheetFooter className="shrink-0 border-t border-outline-variant bg-surface-highest/20 px-5 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={processando}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={processando}
              className="gap-2"
              onClick={() => void handleConfirmarIniciar()}
            >
              {processando ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Iniciar análise
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
