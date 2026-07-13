import { cn } from '@lilog/ui';
import type { ProcessStatus } from '@lilog/contracts';
import { CheckCircle, Clock, Download, RefreshCw, WifiOff, XCircle } from 'lucide-react';

interface OfflineReadinessIndicatorProps {
  status: ProcessStatus | undefined;
  className?: string;
}

const STATUS_CONFIG: Record<
  ProcessStatus,
  { icon: typeof CheckCircle; label: string; className: string }
> = {
  notDownloaded: {
    icon: Clock,
    label: 'Não preparado',
    className: 'text-muted-foreground',
  },
  downloading: {
    icon: Download,
    label: 'Baixando...',
    className: 'text-secondary animate-pulse',
  },
  ready: {
    icon: WifiOff,
    label: 'Pronto offline',
    className: 'text-secondary',
  },
  working: {
    icon: CheckCircle,
    label: 'Em conferência',
    className: 'text-secondary',
  },
  pendingSync: {
    icon: RefreshCw,
    label: 'Sincronização pendente',
    className: 'text-warning',
  },
  syncing: {
    icon: RefreshCw,
    label: 'Sincronizando...',
    className: 'text-secondary animate-spin',
  },
  completed: {
    icon: CheckCircle,
    label: 'Concluído',
    className: 'text-muted-foreground',
  },
  error: {
    icon: XCircle,
    label: 'Erro no download',
    className: 'text-destructive',
  },
  conflict: {
    icon: XCircle,
    label: 'Conflito',
    className: 'text-destructive',
  },
};

export function OfflineReadinessIndicator({
  status,
  className,
}: OfflineReadinessIndicatorProps) {
  const config = status ? STATUS_CONFIG[status] : STATUS_CONFIG.notDownloaded;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-label-sm font-medium',
        config.className,
        className,
      )}
      aria-label={`Status offline: ${config.label}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {config.label}
    </span>
  );
}
