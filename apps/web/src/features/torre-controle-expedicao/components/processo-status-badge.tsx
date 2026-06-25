import { cn } from '@lilog/ui';

import type { ProcessoStatus } from '@/features/torre-controle-expedicao/types/torre-controle.schema';
import { PROCESSO_STATUS_LABELS } from '@/features/torre-controle-expedicao/types/torre-controle.schema';
import { formatarLinhaHorarioProcesso } from '@/features/torre-controle-expedicao/lib/formatar-tempo';
import type { HorarioProcesso } from '@/features/torre-controle-expedicao/types/torre-controle.schema';

const STATUS_STYLES: Record<ProcessoStatus, string> = {
  pendente: 'bg-muted text-muted-foreground border-outline-variant',
  em_andamento: 'bg-warning/10 text-warning border-warning/30',
  concluido: 'bg-primary/10 text-primary border-primary/25',
};

export type ProcessoStatusBadgeProps = {
  status: ProcessoStatus;
  horario?: HorarioProcesso;
  className?: string;
};

function montarTitleHorario(horario: HorarioProcesso | undefined): string | undefined {
  if (!horario) {
    return undefined;
  }

  return [
    formatarLinhaHorarioProcesso(horario.inicio, 'Início'),
    formatarLinhaHorarioProcesso(horario.fim, 'Fim'),
  ].join(' · ');
}

export function ProcessoStatusBadge({
  status,
  horario,
  className,
}: ProcessoStatusBadgeProps) {
  const title = montarTitleHorario(horario);

  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap',
        STATUS_STYLES[status],
        className,
      )}
    >
      {PROCESSO_STATUS_LABELS[status]}
    </span>
  );
}
