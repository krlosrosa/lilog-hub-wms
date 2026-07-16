import { Button, cn } from '@lilog/ui';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  Database,
  FileDown,
  HardDrive,
  Loader2,
  RefreshCw,
  Server,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { hapticLight, hapticMedium } from '@/lib/haptics';

import { SyncStatusV2 } from '../components/sync-status-v2';
import { useCacheManager } from '../hooks/use-cache-manager';
import { useDismissPendingPhotosV2 } from '../hooks/use-dismiss-pending-photos-v2';
import { useForcePullV2 } from '../hooks/use-force-pull-v2';
import { useReabrirV2 } from '../hooks/use-reabrir-v2';
import { useSyncStatusV2 } from '../hooks/use-sync-status-v2';
import {
  formatBytes,
  formatServiceWorkerScriptLabel,
  getStorageUsageTone,
} from '../lib/cache-manager.service';
import {
  buildDemandDiagnostic,
  copyDiagnosticToClipboard,
  downloadDiagnosticJson,
} from '../lib/sync-diagnostic';
import {
  isRecebimentoV2DebugEnabled,
  setRecebimentoV2DebugEnabled,
} from '../lib/sync-debug';
import { showSyncResultToast } from '../lib/sync-result-toast';
import { syncNowV2 } from '../services/auto-sync-v2.service';

interface SyncManagerV2ViewProps {
  demandId: string;
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: typeof HardDrive;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-outline-variant bg-surface">
      <div className="border-b border-outline-variant/60 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
            <Icon className="h-4.5 w-4.5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-label-md font-semibold text-on-surface">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-body-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="space-y-3 px-4 py-3">{children}</div>
    </section>
  );
}

function StorageUsageBar({ usagePercent }: { usagePercent: number | null }) {
  const tone = getStorageUsageTone(usagePercent);
  const width = usagePercent ?? 0;

  return (
    <div className="space-y-2">
      <div className="h-2 overflow-hidden rounded-full bg-surface-container">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            tone === 'danger'
              ? 'bg-destructive'
              : tone === 'warn'
                ? 'bg-warning'
                : 'bg-secondary',
          )}
          style={{ width: `${width}%` }}
        />
      </div>
      {usagePercent != null ? (
        <p className="text-[11px] text-muted-foreground">{usagePercent}% do armazenamento em uso</p>
      ) : null}
    </div>
  );
}

export function SyncManagerV2View({ demandId }: SyncManagerV2ViewProps) {
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Dados da demanda': true,
    Catálogo: false,
    'Sync e mídia': false,
  });
  const [debugModeEnabled, setDebugModeEnabled] = useState(() => isRecebimentoV2DebugEnabled());
  const [isExportingDiagnostic, setIsExportingDiagnostic] = useState(false);

  useEffect(() => {
    setDebugModeEnabled(isRecebimentoV2DebugEnabled());
  }, []);

  const cacheManager = useCacheManager(demandId);
  const syncStatus = useSyncStatusV2(demandId);
  const { forcePull, isPulling, pullDisabled } = useForcePullV2(demandId);
  const { canReabrir, isReabrindo, reabrirHint, reabrirConferencia } =
    useReabrirV2(demandId, syncStatus);
  const dismissPendingPhotos = useDismissPendingPhotosV2(demandId);

  const { snapshot, isLoading, isRefreshing, isClearing, error, refresh } = cacheManager;
  const storage = snapshot?.storage;
  const serviceWorker = snapshot?.serviceWorker;
  const indexedDb = snapshot?.indexedDb;
  const hasDiagnosticOps =
    syncStatus.issueOperations.length > 0 ||
    syncStatus.conflictCount > 0 ||
    syncStatus.rejectedCount > 0 ||
    syncStatus.retryCount > 0 ||
    syncStatus.blockedCount > 0;

  async function handleExportDiagnostic() {
    setIsExportingDiagnostic(true);
    try {
      const diagnostic = await buildDemandDiagnostic(demandId);
      const filename = `sync-diagnostic-${demandId.slice(0, 8)}-${Date.now()}.json`;
      downloadDiagnosticJson(diagnostic, filename);
      toast.success('Diagnóstico exportado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao exportar diagnóstico');
    } finally {
      setIsExportingDiagnostic(false);
    }
  }

  async function handleCopyDiagnostic() {
    setIsExportingDiagnostic(true);
    try {
      const diagnostic = await buildDemandDiagnostic(demandId);
      await copyDiagnosticToClipboard(diagnostic);
      toast.success('Diagnóstico copiado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao copiar diagnóstico');
    } finally {
      setIsExportingDiagnostic(false);
    }
  }

  function handleToggleDebugMode() {
    const next = !debugModeEnabled;
    setRecebimentoV2DebugEnabled(next);
    setDebugModeEnabled(next);
    toast.success(next ? 'Modo diagnóstico ativado' : 'Modo diagnóstico desativado');
  }

  async function handleReabrir() {
    try {
      const ok = await reabrirConferencia();
      if (!ok) return;
      toast.success('Conferência reaberta. Sincronizando alterações pendentes...');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao reabrir conferência');
    }
  }

  async function handleSync() {
    const hadPhotos = syncStatus.pendingPhotoCount > 0;
    syncStatus.setIsSyncing(true);
    try {
      const result = await syncNowV2(demandId, { manual: true });
      if (!result) {
        toast.info('Nada para sincronizar');
        return;
      }
      showSyncResultToast(result, { hadPhotos });
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao sincronizar');
    } finally {
      syncStatus.setIsSyncing(false);
    }
  }

  async function handleClearSwCache(cacheName: string) {
    if (
      !window.confirm(
        `Limpar o cache "${cacheName}"?\n\nOs arquivos serão baixados novamente quando necessário.`,
      )
    ) {
      return;
    }

    try {
      hapticMedium();
      await cacheManager.clearSwCache(cacheName);
      toast.success(`Cache "${cacheName}" limpo`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao limpar cache');
    }
  }

  async function handleClearAllSwCaches() {
    if (
      !window.confirm(
        'Limpar todos os caches do Service Worker?\n\nIsso pode exigir reconexão para recarregar assets e respostas da API em cache.',
      )
    ) {
      return;
    }

    try {
      hapticMedium();
      await cacheManager.clearAllSwCaches();
      toast.success('Caches do Service Worker limpos');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao limpar caches');
    }
  }

  async function handleClearDemandData() {
    if (
      !window.confirm(
        'Limpar todos os dados locais desta demanda?\n\nVocê precisará preparar novamente para uso offline.',
      )
    ) {
      return;
    }

    try {
      hapticMedium();
      await cacheManager.clearDemandData();
      toast.success('Dados locais da demanda removidos');
      void navigate({ to: '/recebimento-v2/$id/preparacao', params: { id: demandId } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao limpar dados locais');
    }
  }

  async function handleClearFullDatabase() {
    if (
      !window.confirm(
        'Limpar o banco IndexedDB completo do Recebimento V2?\n\nTodas as demandas offline, catálogos e filas de sync serão removidos.',
      )
    ) {
      return;
    }

    try {
      hapticMedium();
      await cacheManager.clearFullDatabase();
      toast.success('Banco local limpo');
      void navigate({ to: '/recebimento-v2' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao limpar banco local');
    }
  }

  function toggleGroup(label: string) {
    hapticLight();
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <div className="page-enter flex flex-col pb-safe-offset-4">
      <div className="sticky top-0 z-20 border-b border-outline-variant/60 bg-surface/95 backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
        <div className="flex items-center gap-3 px-margin-mobile py-3">
          <Link
            to="/recebimento-v2/$id/itens"
            params={{ id: demandId }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation transition-transform active:scale-90"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-headline-sm font-bold text-on-surface">Cache e sincronização</h1>
            <p className="mt-0.5 text-body-sm text-on-surface-variant">
              Armazenamento local, caches do PWA e fila de sync desta demanda.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isRefreshing || isClearing}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant touch-manipulation transition-transform active:scale-90 disabled:opacity-50"
            aria-label="Atualizar informações"
          >
            <RefreshCw className={cn('h-4.5 w-4.5', isRefreshing && 'animate-spin')} aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-4 px-margin-mobile">
        {error ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
            <p className="text-body-sm text-destructive">{error}</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            <span className="text-body-sm">Carregando informações de cache...</span>
          </div>
        ) : (
          <>
            <SectionCard
              title="Armazenamento"
              description="Uso total disponível para este app no dispositivo."
              icon={HardDrive}
            >
              {storage ? (
                <>
                  <div className="space-y-1">
                    <p className="text-label-sm font-medium text-on-surface">
                      {storage.usage != null ? formatBytes(storage.usage) : '—'} usados de{' '}
                      {storage.quota != null ? formatBytes(storage.quota) : '—'} disponíveis
                    </p>
                    <StorageUsageBar usagePercent={storage.usagePercent} />
                  </div>

                  {(storage.indexedDbUsage != null || storage.cachesUsage != null) && (
                    <div className="rounded-md border border-outline-variant/60 bg-surface-container/40 px-3 py-2 text-[11px] text-muted-foreground">
                      {storage.indexedDbUsage != null ? (
                        <span>IndexedDB: {formatBytes(storage.indexedDbUsage)}</span>
                      ) : null}
                      {storage.indexedDbUsage != null && storage.cachesUsage != null ? ' · ' : null}
                      {storage.cachesUsage != null ? (
                        <span>Cache SW: {formatBytes(storage.cachesUsage)}</span>
                      ) : null}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-body-sm text-muted-foreground">
                  Estimativa de armazenamento indisponível neste navegador.
                </p>
              )}
            </SectionCard>

            <SectionCard
              title="Cache do Service Worker"
              description="Assets e respostas HTTP mantidos pelo PWA para uso offline."
              icon={Server}
            >
              <div className="rounded-md border border-outline-variant/60 bg-surface-container/40 px-3 py-2">
                <p className="text-label-sm font-medium text-on-surface">
                  {serviceWorker?.isControlled ? 'Service worker ativo' : 'Sem controle ativo'}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {formatServiceWorkerScriptLabel(serviceWorker?.scriptUrl ?? null)}
                </p>
                {serviceWorker?.scopes.length ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Escopos: {serviceWorker.scopes.join(', ')}
                  </p>
                ) : null}
              </div>

              {serviceWorker?.caches.length ? (
                <div className="space-y-2">
                  {serviceWorker.caches.map((cache) => (
                    <div
                      key={cache.name}
                      className="flex items-start justify-between gap-3 rounded-md border border-outline-variant/60 bg-surface/80 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-label-sm font-medium text-on-surface">
                          {cache.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {cache.entryCount} entrada(s) · {formatBytes(cache.totalBytes)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleClearSwCache(cache.name)}
                        disabled={isClearing}
                        className="shrink-0 rounded-md border border-outline-variant px-2.5 py-1.5 text-[11px] font-medium text-destructive touch-manipulation disabled:opacity-50"
                      >
                        Limpar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-muted-foreground">Nenhum cache do Service Worker encontrado.</p>
              )}

              {serviceWorker?.caches.length ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isClearing}
                  onClick={() => void handleClearAllSwCaches()}
                  className="h-10 w-full border-destructive/30 text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                  Limpar todos os caches SW
                </Button>
              ) : null}
            </SectionCard>

            <SectionCard
              title="Banco de dados local"
              description="IndexedDB do Recebimento V2 com dados offline e fila de sync."
              icon={Database}
            >
              {indexedDb ? (
                <>
                  <div className="rounded-md border border-outline-variant/60 bg-surface-container/40 px-3 py-2">
                    <p className="text-label-sm font-medium text-on-surface">
                      {indexedDb.totalRecords.toLocaleString('pt-BR')} registro(s) no total
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Banco: lilog-recebimento-v2-db
                    </p>
                  </div>

                  <div className="space-y-2">
                    {indexedDb.groups.map((group) => {
                      const expanded = expandedGroups[group.label] ?? false;
                      const groupTotal = group.tables.reduce(
                        (sum, table) => sum + table.totalCount,
                        0,
                      );

                      return (
                        <div
                          key={group.label}
                          className="overflow-hidden rounded-md border border-outline-variant/60"
                        >
                          <button
                            type="button"
                            onClick={() => toggleGroup(group.label)}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left touch-manipulation"
                            aria-expanded={expanded}
                          >
                            <div>
                              <p className="text-label-sm font-medium text-on-surface">{group.label}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {groupTotal.toLocaleString('pt-BR')} registro(s)
                              </p>
                            </div>
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                                expanded && 'rotate-180',
                              )}
                              aria-hidden
                            />
                          </button>

                          {expanded ? (
                            <div className="space-y-1 border-t border-outline-variant/60 px-3 py-2">
                              {group.tables.map((table) => (
                                <div
                                  key={table.key}
                                  className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-[11px]"
                                >
                                  <span className="text-on-surface">{table.label}</span>
                                  <span className="text-right text-muted-foreground">
                                    {table.totalCount.toLocaleString('pt-BR')}
                                    {table.demandCount != null
                                      ? ` · desta demanda: ${table.demandCount.toLocaleString('pt-BR')}`
                                      : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isClearing}
                      onClick={() => void handleClearDemandData()}
                      className="h-10 w-full border-destructive/30 text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                      Limpar dados desta demanda
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isClearing}
                      onClick={() => void handleClearFullDatabase()}
                      className="h-10 w-full border-destructive/30 text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                      Limpar banco completo
                    </Button>
                  </div>

                  <div className="rounded-md border border-outline-variant/60 bg-surface-container/40 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-label-sm font-medium text-on-surface">Modo diagnóstico</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Ativa logs detalhados no console do navegador.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={debugModeEnabled}
                        onClick={handleToggleDebugMode}
                        className={cn(
                          'relative h-7 w-12 shrink-0 rounded-full transition-colors',
                          debugModeEnabled ? 'bg-secondary' : 'bg-outline-variant',
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 h-6 w-6 rounded-full bg-surface shadow transition-transform',
                            debugModeEnabled ? 'translate-x-5' : 'translate-x-0.5',
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </SectionCard>

            <SectionCard
              title="Sincronização"
              description="Envie alterações locais ou atualize dados do servidor."
              icon={RefreshCw}
            >
              {hasDiagnosticOps ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isExportingDiagnostic}
                    onClick={() => void handleExportDiagnostic()}
                    className="h-10 flex-1"
                  >
                    {isExportingDiagnostic ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <FileDown className="mr-2 h-4 w-4" aria-hidden />
                    )}
                    Exportar diagnóstico
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isExportingDiagnostic}
                    onClick={() => void handleCopyDiagnostic()}
                    className="h-10 shrink-0"
                  >
                    Copiar
                  </Button>
                </div>
              ) : null}

              <SyncStatusV2
                demandId={demandId}
                syncStatus={syncStatus}
                onSync={() => void handleSync()}
                onPull={() => void forcePull()}
                onDismissPendingPhotos={() => dismissPendingPhotos()}
                onReabrir={() => void handleReabrir()}
                canReabrir={canReabrir}
                isReabrindo={isReabrindo}
                reabrirHint={reabrirHint}
                isPulling={isPulling}
                pullDisabled={pullDisabled}
              />
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}
