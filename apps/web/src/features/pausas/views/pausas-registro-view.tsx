'use client';

import { Circle, Pause } from 'lucide-react';
import { toast } from 'sonner';

import { SidebarMain } from '@/components/layout/sidebar';
import { RegistroActiveScreen } from '@/features/pausas/components/registro-active-screen';
import { RegistroIdScreen } from '@/features/pausas/components/registro-id-screen';
import { SessaoPausasContextBanner } from '@/features/pausas/components/sessao-pausas-context-banner';
import { usePausasRegistro } from '@/features/pausas/hooks/use-pausas-registro';
import { normalizeMatricula } from '@/features/pausas/lib/pausas-mappers';

export function PausasRegistroView() {
  const {
    operatorId,
    setOperatorId,
    showSelection,
    selectedType,
    selectTipo,
    startPause,
    finishPause,
    timerDisplay,
    activeLabel,
    operador,
    displayId,
    showActive,
    showIdEntry,
    isLoading,
    isSubmitting,
    semUnidade,
    semSessaoAberta,
    sessaoAtiva,
    normalizedId,
  } = usePausasRegistro();

  const canOperate = !semUnidade && !semSessaoAberta && sessaoAtiva;
  const operadorNaoEncontrado = Boolean(
    canOperate &&
      normalizedId.length >= 3 &&
      !operador &&
      !showActive,
  );

  const handleStartPause = async () => {
    const result = await startPause();
    if (!result.success) {
      if (result.error) toast.error(result.error);
      return;
    }
    toast.success('Pausa iniciada com sucesso.');
  };

  const handleFinishPause = async () => {
    const result = await finishPause();
    if (result.success) {
      toast.success('Pausa finalizada. Retorne à operação.');
    }
  };

  return (
    <SidebarMain>
      <main className="min-h-dvh bg-background px-margin-mobile py-6 md:px-margin-desktop md:py-8">
        <div className="mx-auto max-w-container space-y-gutter">
          <header className="flex flex-col items-center justify-between gap-4 border-b border-outline-variant pb-6 md:flex-row">
            <div className="text-center md:text-left">
              <h1 className="text-headline-lg font-semibold text-foreground">
                Terminal de Pausas
              </h1>
              <p className="text-body-md text-muted-foreground">
                {sessaoAtiva
                  ? `${sessaoAtiva.equipeNome} • ${sessaoAtiva.escalaNome}`
                  : 'Registro de Pausas'}
              </p>
            </div>
            {canOperate && (
              <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-muted px-4 py-2">
                <Circle className="size-2 fill-status-active text-status-active" />
                <span className="text-label-md font-medium text-status-active">
                  SESSÃO ABERTA
                </span>
              </div>
            )}
          </header>

          <SessaoPausasContextBanner
            semUnidade={semUnidade}
            semSessaoAberta={semSessaoAberta}
            isLoading={isLoading && !sessaoAtiva}
            sessaoAtiva={sessaoAtiva}
          />

          {canOperate && (
            <>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Pause className="size-5 text-primary" aria-hidden />
                <span className="text-label-md font-medium text-primary">
                  Registrar Pausa
                </span>
              </div>

              {showIdEntry && (
                <RegistroIdScreen
                  operatorId={operatorId}
                  onOperatorIdChange={(value) => void setOperatorId(value)}
                  showSelection={showSelection}
                  selectedType={selectedType}
                  onSelectTipo={selectTipo}
                  onStartPause={() => void handleStartPause()}
                  isSubmitting={isSubmitting}
                  operadorNaoEncontrado={operadorNaoEncontrado}
                />
              )}

              {showActive && (
                <RegistroActiveScreen
                  activeLabel={activeLabel}
                  timerDisplay={timerDisplay}
                  operadorNome={operador?.nome ?? 'Operador'}
                  displayId={displayId || normalizeMatricula(operatorId)}
                  onFinishPause={() => void handleFinishPause()}
                />
              )}
            </>
          )}
        </div>
      </main>
    </SidebarMain>
  );
}
