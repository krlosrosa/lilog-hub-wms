import type { PresencaFiltro } from '../types';
import { FilterChip } from './sessao-sub-header';

export interface PresencaFilterChipsProps {
  filtro: PresencaFiltro;
  stats: { pendentes: number; presentes: number; faltas: number; total: number };
  onChange: (filtro: PresencaFiltro) => void;
}

export function PresencaFilterChips({
  filtro,
  stats,
  onChange,
}: PresencaFilterChipsProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
      role="tablist"
      aria-label="Filtrar funcionários"
    >
      <FilterChip
        label="Pendentes"
        count={stats.pendentes}
        active={filtro === 'pendentes'}
        onClick={() => onChange('pendentes')}
      />
      <FilterChip
        label="Presentes"
        count={stats.presentes}
        active={filtro === 'presentes'}
        onClick={() => onChange('presentes')}
      />
      <FilterChip
        label="Faltas"
        count={stats.faltas}
        active={filtro === 'faltas'}
        onClick={() => onChange('faltas')}
      />
      <FilterChip
        label="Todos"
        count={stats.total}
        active={filtro === 'todos'}
        onClick={() => onChange('todos')}
      />
    </div>
  );
}
