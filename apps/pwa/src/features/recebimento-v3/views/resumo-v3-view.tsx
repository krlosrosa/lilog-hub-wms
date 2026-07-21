import {
  Button,
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@lilog/ui';
import { Link } from '@tanstack/react-router';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  CloudUpload,
  Loader2,
  Package,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';

import { ChecklistResumoV2Card } from '@/features/recebimento-v2/components/checklist-resumo-v2-card';
import { TemperaturaProdutoV2ModalButton } from '@/features/recebimento-v2/components/temperatura-produto-v2-card';
import { TEMPERATURAS_BAU_INCOMPLETAS_MSG } from '@/features/recebimento-v2/lib/temperatura-bau-v2';

import { useConferenceExecutorV3 } from '../context/conference-executor.context';
import { useFinalizarV3 } from '../hooks/use-finalizar-v3';

const FINALIZATION_STEPS = [
  'validate_connection',
  'build_payload',
  'submit_conference',
  'upload_photos',
  'cleanup',
] as const;

const STEP_LABELS: Record<(typeof FINALIZATION_STEPS)[number], string> = {
  validate_connection: 'Verificando conexão',
  build_payload: 'Preparando dados',
  submit_conference: 'Enviando conferência',
  upload_photos: 'Enviando fotos',
  cleanup: 'Concluindo',
};

export function ResumoV3View({ demandId }: { demandId: string }) {
  const { mode } = useConferenceExecutorV3();
  const {
    finalizar,
    validateBeforeSync,
    divergencias,
    naoConferidos,
    divergenciasAtivas,
    avarias,
    checklist,
    temperaturasCompletas,
    temperaturasPreenchidas,
    temperaturasTotal,
    conferenciasCount,
    elapsedMinutes,
    dock,
    isOnline,
    isFinalizing,
    showConfirmModal,
    setShowConfirmModal,
    canFinalize,
    error,
    progress,
  } = useFinalizarV3(demandId);

  const [quantidadePaletes, setQuantidadePaletes] = useState('1');
  const [teveSobreposicao, setTeveSobreposicao] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const resumoStats = useMemo(
    () => ({
      totalItens: divergencias.length,
      conferidos: divergencias.filter((item) => item.status !== 'nao_conferido').length,
      divergencias: divergenciasAtivas.length,
      avarias: avarias.length,
    }),
    [avarias.length, divergencias, divergenciasAtivas.length],
  );

  const paletesNumber = Number.parseInt(quantidadePaletes, 10);
  const syncValidation = useMemo(
    () => validateBeforeSync(paletesNumber),
    [paletesNumber, validateBeforeSync],
  );

  const handleOpenConfirm = () => {
    hapticMedium();
    if (!canFinalize) {
      const validation = validateBeforeSync(paletesNumber);
      setValidationErrors(validation.errors);
      return;
    }
    setValidationErrors([]);
    setShowConfirmModal(true);
  };

  const handleFinalize = async () => {
    hapticMedium();
    const validation = validateBeforeSync(paletesNumber);
    setValidationErrors(validation.errors);
    if (!validation.ok) {
      return;
    }
    await finalizar(paletesNumber, teveSobreposicao);
  };

  const submitLabel =
    mode === 'offline' ? 'Enviar para o servidor' : 'Finalizar conferência';

  return (
    <div className="page-enter pb-24">
      <div className="sticky top-0 z-10 border-b border-outline-variant/60 bg-surface/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-margin-mobile py-3">
          <Link
            to="/recebimento-v3/$id/itens"
            params={{ id: demandId }}
            className="rounded-lg p-2 text-on-surface-variant touch-manipulation active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-title-md text-on-surface">Resumo V3</h1>
            <p className="truncate text-body-sm text-on-surface-variant">
              Modo {mode === 'online' ? 'Online' : 'Offline'} · Docas {dock}
            </p>
          </div>
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-label-sm',
              mode === 'online'
                ? 'bg-primary-container text-on-primary-container'
                : isOnline
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-destructive/10 text-destructive',
            )}
          >
            {mode === 'online' || isOnline ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {mode === 'online' ? 'Online' : isOnline ? 'Offline · Online' : 'Sem internet'}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4 px-margin-mobile">
        {mode === 'offline' && !isOnline ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <div className="flex items-start gap-2">
              <WifiOff className="mt-0.5 h-5 w-5 text-destructive" />
              <div>
                <p className="text-label-md text-on-surface">Sem conexão com a internet</p>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  A conferência foi salva localmente. Conecte-se à internet para enviar ao servidor.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Itens conferidos" value={`${resumoStats.conferidos}/${resumoStats.totalItens}`} />
          <StatCard label="Divergências" value={String(resumoStats.divergencias)} />
          <StatCard label="Avarias" value={String(resumoStats.avarias)} />
          <StatCard label="Tempo" value={elapsedMinutes ? `${elapsedMinutes} min` : '—'} />
        </div>

        {mode === 'offline' ? (
          <div className="rounded-xl border border-outline-variant bg-surface p-4">
            <p className="text-label-md text-on-surface">Pré-requisitos para envio</p>
            <ul className="mt-3 space-y-2">
              {syncValidation.preconditions.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-body-sm">
                  {item.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  )}
                  <div>
                    <span className={item.ok ? 'text-on-surface' : 'text-destructive'}>
                      {item.label}
                    </span>
                    {!item.ok && item.message ? (
                      <p className="text-label-sm text-on-surface-variant">{item.message}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ChecklistResumoV2Card checklist={checklist} />

        <div className="rounded-xl border border-outline-variant bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-label-md text-on-surface">Temperaturas do baú</p>
              <p className="text-body-sm text-on-surface-variant">
                {temperaturasPreenchidas}/{temperaturasTotal} etapas preenchidas
              </p>
            </div>
            <TemperaturaProdutoV2ModalButton demandId={demandId} />
          </div>
          {!temperaturasCompletas ? (
            <p className="mt-3 text-body-sm text-warning">{TEMPERATURAS_BAU_INCOMPLETAS_MSG}</p>
          ) : null}
        </div>

        {mode === 'offline' && (divergenciasAtivas.length > 0 || naoConferidos.length > 0) ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <p className="text-label-md text-on-surface">Avisos</p>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Estes pontos não impedem o envio ao servidor.
            </p>
            <ul className="mt-3 space-y-2 text-body-sm text-on-surface-variant">
              {divergenciasAtivas.length > 0 ? (
                <li>
                  {divergenciasAtivas.length} divergência(s) encontrada(s) — serão registradas no
                  encerramento.
                </li>
              ) : null}
              {naoConferidos.length > 0 ? (
                <li>
                  {naoConferidos.length} item(ns) ainda não conferido(s) — o envio incluirá apenas
                  os itens já conferidos.
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        {mode === 'online' && divergenciasAtivas.length > 0 ? (
          <div className="rounded-xl border border-warning/30 bg-warning-container/40 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 text-warning" />
              <div>
                <p className="text-label-md text-on-surface">Divergências encontradas</p>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  Revise os itens antes de finalizar.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {conferenciasCount === 0 ? (
          <div className="rounded-xl border border-warning/30 bg-warning-container/40 p-4 text-body-sm text-on-surface-variant">
            Conferir ao menos um item antes de enviar.
          </div>
        ) : null}

        {(error || validationErrors.length > 0) && !isFinalizing ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-body-sm text-destructive">
            {error ?? validationErrors[0]}
          </div>
        ) : null}

        <Button
          className="w-full"
          disabled={!canFinalize || isFinalizing}
          onClick={handleOpenConfirm}
        >
          {isFinalizing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <CloudUpload className="mr-2 h-4 w-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>

      <Sheet open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle>{mode === 'offline' ? 'Enviar para o servidor' : 'Confirmar finalização'}</SheetTitle>
            <SheetDescription>
              {mode === 'offline'
                ? 'Os dados locais serão enviados em uma única requisição. Em caso de erro, nada será apagado.'
                : 'A conferência será encerrada e enviada imediatamente para a API.'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-label-sm text-on-surface">Quantidade de paletes</span>
              <input
                type="number"
                min={1}
                value={quantidadePaletes}
                onChange={(event) => setQuantidadePaletes(event.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2"
              />
            </label>

            <label className="flex items-center gap-2 text-body-sm text-on-surface">
              <input
                type="checkbox"
                checked={teveSobreposicao}
                onChange={(event) => setTeveSobreposicao(event.target.checked)}
              />
              Houve sobreposição de carga
            </label>

            {isFinalizing && progress ? (
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                <p className="text-label-sm text-on-surface">{progress.label}</p>
                {progress.photoProgress ? (
                  <p className="mt-1 text-label-sm text-on-surface-variant">
                    Fotos: {progress.photoProgress.uploaded}/{progress.photoProgress.total}
                  </p>
                ) : null}
                <div className="mt-3 space-y-2">
                  {FINALIZATION_STEPS.map((step) => {
                    const currentIndex = FINALIZATION_STEPS.indexOf(progress.step);
                    const stepIndex = FINALIZATION_STEPS.indexOf(step);
                    const done = stepIndex < currentIndex;
                    const active = stepIndex === currentIndex;

                    return (
                      <div key={step} className="flex items-center gap-2 text-body-sm">
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-secondary" />
                        ) : active ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <Package className="h-4 w-4 text-on-surface-variant" />
                        )}
                        <span className={active ? 'text-on-surface' : 'text-on-surface-variant'}>
                          {STEP_LABELS[step]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-body-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setShowConfirmModal(false)} disabled={isFinalizing}>
                Cancelar
              </Button>
              <Button onClick={() => void handleFinalize()} disabled={isFinalizing}>
                {error && !isFinalizing ? 'Tentar novamente' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4">
      <div className="flex items-center gap-2 text-on-surface-variant">
        <ClipboardList className="h-4 w-4" />
        <span className="text-label-sm">{label}</span>
      </div>
      <p className="mt-2 text-title-md text-on-surface">{value}</p>
    </div>
  );
}
