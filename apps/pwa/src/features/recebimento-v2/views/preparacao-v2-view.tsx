import { Button, cn } from '@lilog/ui';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Database,
  Download,
  HardDrive,
  Image,
  Loader2,
  Package,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { hapticMedium } from '@/lib/haptics';

import { V2BetaBadge } from '../components/v2-beta-badge';
import { useBootstrapV2 } from '../hooks/use-bootstrap-v2';
import { useProcessCapabilitiesV2 } from '../hooks/use-process-capabilities-v2';
import { useProcessV2 } from '../hooks/use-process-v2';
import type { BootstrapStep } from '../types/recebimento-v2.schema';

const STEP_CONFIG: Record<
  BootstrapStep,
  { icon: typeof CheckCircle; label: string; description: string }
> = {
  session: {
    icon: ShieldCheck,
    label: 'Validar sessão',
    description: 'Verifica autenticação e permissões',
  },
  catalog: {
    icon: Database,
    label: 'Catálogo de produtos',
    description: 'Baixa dados de produtos para busca offline',
  },
  'reference-data': {
    icon: HardDrive,
    label: 'Dados de referência',
    description: 'Docas, motivos de avaria e configurações',
  },
  package: {
    icon: Package,
    label: 'Pacote da demanda',
    description: 'Itens esperados, checklists e temperaturas',
  },
  snapshot: {
    icon: RefreshCw,
    label: 'Conferências e avarias',
    description: 'Carrega itens já conferidos e avarias do servidor',
  },
  media: {
    icon: Image,
    label: 'Mídias',
    description: 'Miniaturas e metadados de imagens',
  },
  done: {
    icon: CheckCircle,
    label: 'Pronto!',
    description: 'Demanda disponível para uso offline',
  },
};

interface StorageEstimate {
  quota?: number;
  usage?: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface PreparacaoV2ViewProps {
  demandId: string;
}

export function PreparacaoV2View({ demandId }: PreparacaoV2ViewProps) {
  const navigate = useNavigate();
  const { process, isReady } = useProcessV2(demandId);
  const { souApoio } = useProcessCapabilitiesV2(demandId);
  const { prepare, progress, isPreparing, error } = useBootstrapV2();
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimate | null>(null);

  useEffect(() => {
    navigator.storage?.estimate().then((e) => setStorageEstimate(e)).catch(() => null);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    void navigate({
      to: '/recebimento-v2/$id/itens',
      params: { id: demandId },
      replace: true,
    });
  }, [demandId, isReady, navigate]);

  const completedSteps = (process?.downloadProgress?.completedSteps ?? []) as BootstrapStep[];

  const allSteps: BootstrapStep[] = [
    'session',
    'catalog',
    'reference-data',
    'package',
    'snapshot',
    'media',
    'done',
  ];

  function getStepStatus(step: BootstrapStep): 'done' | 'active' | 'pending' | 'error' {
    if (completedSteps.includes(step)) return 'done';
    if (progress?.step === step && isPreparing) return 'active';
    if (error && progress?.step === step) return 'error';
    return 'pending';
  }

  return (
    <div className="page-enter flex flex-col pb-safe-offset-4">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-outline-variant/60 bg-surface/95 backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
        <div className="flex items-center gap-3 px-margin-mobile py-3">
          <Link
            to="/recebimento-v2"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation transition-transform active:scale-90"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-headline-sm font-bold text-on-surface">
              {souApoio ? 'Preparação para apoio' : 'Preparação offline'}
            </h1>
            <p className="mt-0.5 text-body-sm text-on-surface-variant">
              {souApoio
                ? 'Baixe itens esperados, conferências do responsável e catálogo para conferir offline.'
                : 'Baixe os dados da demanda para usar sem conexão.'}
            </p>
            <V2BetaBadge className="mt-1" />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4 px-margin-mobile">
        {/* Storage estimate */}
        {storageEstimate && (
          <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container/50 px-3 py-2.5">
            <HardDrive className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <p className="text-label-sm text-muted-foreground">
              Armazenamento:{' '}
              <span className="font-medium text-on-surface">
                {storageEstimate.usage != null ? formatBytes(storageEstimate.usage) : '—'}
              </span>{' '}
              usados de{' '}
              {storageEstimate.quota != null ? formatBytes(storageEstimate.quota) : '—'}
            </p>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-2">
          {allSteps.map((step) => {
            const config = STEP_CONFIG[step];
            const status = getStepStatus(step);
            const Icon = config.icon;

            return (
              <div
                key={step}
                className={cn(
                  'flex items-start gap-3 rounded-lg border px-4 py-3 transition-colors',
                  status === 'done'
                    ? 'border-secondary/30 bg-secondary/8'
                    : status === 'active'
                      ? 'border-secondary/50 bg-secondary/12 shadow-sm'
                      : status === 'error'
                        ? 'border-destructive/30 bg-destructive/8'
                        : 'border-outline-variant bg-surface',
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    status === 'done'
                      ? 'bg-secondary text-on-secondary'
                      : status === 'active'
                        ? 'bg-secondary/20 text-secondary'
                        : status === 'error'
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-surface-container text-muted-foreground',
                  )}
                >
                  {status === 'active' ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : status === 'error' ? (
                    <AlertCircle className="h-4 w-4" aria-hidden />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden />
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p
                    className={cn(
                      'text-label-md font-semibold',
                      status === 'done'
                        ? 'text-on-surface'
                        : status === 'pending'
                          ? 'text-muted-foreground'
                          : 'text-on-surface',
                    )}
                  >
                    {config.label}
                  </p>
                  <p className="text-body-sm text-muted-foreground">{config.description}</p>
                </div>

                {status === 'done' && (
                  <CheckCircle className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
                )}
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
            <p className="text-body-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Action button */}
        {isReady ? (
          <Link
            to="/recebimento-v2/$id/itens"
            params={{ id: demandId }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-label-md font-semibold text-on-secondary touch-manipulation transition-transform active:scale-[0.98]"
          >
            {souApoio ? 'Iniciar apoio na conferência' : 'Iniciar conferência'}
          </Link>
        ) : (
          <Button
            type="button"
            disabled={isPreparing}
            onClick={() => {
              hapticMedium();
              void prepare(demandId);
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-secondary text-label-md font-semibold text-on-secondary touch-manipulation transition-transform active:scale-[0.98] disabled:opacity-100 disabled:saturate-75"
          >
            {isPreparing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Preparando...
              </>
            ) : error ? (
              <>
                <RefreshCw className="h-5 w-5" aria-hidden />
                Tentar novamente
              </>
            ) : (
              <>
                <Download className="h-5 w-5" aria-hidden />
                {souApoio ? 'Baixar para apoiar' : 'Preparar para uso offline'}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
