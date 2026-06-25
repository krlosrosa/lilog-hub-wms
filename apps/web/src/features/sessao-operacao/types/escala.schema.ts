import { z } from 'zod';

export const horarioRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export const escalaFormSchema = z.object({
  nomeEscala: z.string().min(1, 'Informe o nome da escala').max(100),
  nomeEquipe: z.string().min(1, 'Informe o nome da equipe').max(100),
  area: z.string().max(50).optional(),
  horaInicio: z.string().regex(horarioRegex, 'Horário inválido'),
  horaFim: z.string().regex(horarioRegex, 'Horário inválido'),
}).refine((data) => data.horaInicio !== data.horaFim, {
  message: 'Hora de início e fim não podem ser iguais',
  path: ['horaFim'],
});

export type EscalaFormValues = z.infer<typeof escalaFormSchema>;

export const DEFAULT_ESCALA_FORM: EscalaFormValues = {
  nomeEscala: '',
  nomeEquipe: '',
  area: '',
  horaInicio: '06:00',
  horaFim: '14:00',
};

export function inferCruzaMeiaNoite(horaInicio: string, horaFim: string): boolean {
  const toMinutes = (value: string) => {
    const [h, m] = value.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };

  return toMinutes(horaFim) < toMinutes(horaInicio);
}

export function formatHorarioIntervalo(
  inicio: string,
  fim: string,
): string {
  return `${inicio} – ${fim}`;
}
