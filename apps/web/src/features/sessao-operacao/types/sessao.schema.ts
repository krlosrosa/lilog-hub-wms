import { z } from 'zod';

export const sessaoFormSchema = z.object({
  escalaId: z.string().uuid('Selecione uma escala'),
  dataReferencia: z.string().min(1, 'Informe a data de referência'),
});

export type SessaoFormValues = z.infer<typeof sessaoFormSchema>;

export const DEFAULT_SESSAO_FORM: SessaoFormValues = {
  escalaId: '',
  dataReferencia: new Date().toISOString().slice(0, 10),
};

export const SESSAO_STATUS_LABELS = {
  planejada: 'Planejada',
  aberta: 'Aberta',
  encerrada: 'Encerrada',
  cancelada: 'Cancelada',
} as const;

export const PRESENCA_STATUS_LABELS = {
  esperado: 'Esperado',
  presente: 'Presente',
  falta: 'Falta',
  atestado: 'Atestado',
  folga: 'Folga',
  atraso: 'Atraso',
} as const;

export const PRESENCA_STATUS_OPTIONS = Object.entries(PRESENCA_STATUS_LABELS).map(
  ([value, label]) => ({
    value: value as keyof typeof PRESENCA_STATUS_LABELS,
    label,
  }),
);

export function formatDataReferencia(value: string): string {
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
