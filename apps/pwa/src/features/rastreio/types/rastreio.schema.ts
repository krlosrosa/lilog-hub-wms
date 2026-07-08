import { z } from 'zod';

export const rastreioSituacaoSchema = z.enum([
  'agendado',
  'aguardando',
  'liberado_para_conferencia',
  'em_conferencia',
  'conferido',
  'finalizado',
  'cancelado',
]);

export type RastreioSituacao = z.infer<typeof rastreioSituacaoSchema>;

export const rastreioStatusSchema = z.object({
  placa: z.string().nullable(),
  transportadoraNome: z.string().nullable(),
  situacao: rastreioSituacaoSchema,
  situacaoLabel: z.string(),
  docaNome: z.string().nullable(),
  horarioPrevisto: z.string(),
  dataChegada: z.string().nullable(),
  unidadeNome: z.string(),
  finalizado: z.boolean(),
});

export type RastreioStatus = z.infer<typeof rastreioStatusSchema>;

export const RASTREIO_TIMELINE: Array<{
  situacao: RastreioSituacao;
  label: string;
}> = [
  { situacao: 'agendado', label: 'Agendado' },
  { situacao: 'aguardando', label: 'Aguardando doca' },
  { situacao: 'liberado_para_conferencia', label: 'Encostar na doca' },
  { situacao: 'em_conferencia', label: 'Conferência' },
  { situacao: 'conferido', label: 'Conferido' },
  { situacao: 'finalizado', label: 'Finalizado' },
];

export function resolveTimelineIndex(situacao: RastreioSituacao): number {
  if (situacao === 'cancelado') {
    return -1;
  }

  const index = RASTREIO_TIMELINE.findIndex((step) => step.situacao === situacao);
  return index >= 0 ? index : 0;
}

export function formatRastreioHorario(iso: string | null): string {
  if (!iso) {
    return '—';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
