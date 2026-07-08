import { cn } from '@lilog/ui';

import type {
  DemandaArmazenagemStatusApi,
  ItemArmazenagemStatusApi,
} from '../types/armazenagem.api';
import {
  DEMANDA_ARMAZENAGEM_STATUS_LABELS,
  ITEM_ARMAZENAGEM_STATUS_LABELS,
} from '../types/armazenagem.api';

const DEMANDA_TONE: Record<DemandaArmazenagemStatusApi, string> = {
  aguardando_validacao: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  aguardando_inicio: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  em_andamento: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  concluida: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  cancelada: 'bg-muted text-muted-foreground',
};

const ITEM_TONE: Record<ItemArmazenagemStatusApi, string> = {
  pendente: 'bg-muted text-muted-foreground',
  em_andamento: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  armazenado: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  divergente: 'bg-destructive/10 text-destructive',
};

export function DemandaArmazenagemStatusBadge({
  status,
}: {
  status: DemandaArmazenagemStatusApi;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        DEMANDA_TONE[status],
      )}
    >
      {DEMANDA_ARMAZENAGEM_STATUS_LABELS[status]}
    </span>
  );
}

export function ItemArmazenagemStatusBadge({
  status,
}: {
  status: ItemArmazenagemStatusApi;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        ITEM_TONE[status],
      )}
    >
      {ITEM_ARMAZENAGEM_STATUS_LABELS[status]}
    </span>
  );
}
