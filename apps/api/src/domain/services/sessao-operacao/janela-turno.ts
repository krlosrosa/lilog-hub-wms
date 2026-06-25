export const DEFAULT_TIMEZONE = 'America/Fortaleza';

/** Fortaleza não observa horário de verão — offset fixo UTC-3. */
const TIMEZONE_UTC_OFFSET: Record<string, string> = {
  'America/Fortaleza': '-03:00',
};

export type JanelaTurno = {
  inicio: Date;
  fim: Date;
};

export type ResolveJanelaPlanejadaInput = {
  dataReferencia: string;
  horaInicio: string;
  horaFim: string;
  cruzaMeiaNoite: boolean;
  timezone?: string;
};

const TIME_REGEX = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function normalizeTime(value: string): string {
  const match = value.trim().match(TIME_REGEX);
  if (!match?.[1] || !match[2]) {
    throw new Error(`Horário inválido: ${value}`);
  }

  const hours = match[1].padStart(2, '0');
  const minutes = match[2];
  const seconds = match[3] ?? '00';

  return `${hours}:${minutes}:${seconds}`;
}

function timeToMinutes(value: string): number {
  const normalized = normalizeTime(value);
  const parts = normalized.split(':').map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  const seconds = parts[2] ?? 0;
  return hours * 60 + minutes + seconds / 60;
}

function assertValidDateReference(dataReferencia: string): void {
  if (!DATE_REGEX.test(dataReferencia)) {
    throw new Error(`Data de referência inválida: ${dataReferencia}`);
  }

  const parts = dataReferencia.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  if (year == null || month == null || day == null) {
    throw new Error(`Data de referência inválida: ${dataReferencia}`);
  }

  const probe = new Date(Date.UTC(year, month - 1, day));

  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    throw new Error(`Data de referência inválida: ${dataReferencia}`);
  }
}

function addDaysToDateReference(dataReferencia: string, days: number): string {
  assertValidDateReference(dataReferencia);
  const parts = dataReferencia.split('-').map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

function resolveUtcOffset(timezone: string): string {
  const offset = TIMEZONE_UTC_OFFSET[timezone];
  if (!offset) {
    throw new Error(`Timezone não suportado: ${timezone}`);
  }
  return offset;
}

function buildInstant(
  dataReferencia: string,
  hora: string,
  timezone: string,
): Date {
  assertValidDateReference(dataReferencia);
  const offset = resolveUtcOffset(timezone);
  const instant = new Date(`${dataReferencia}T${normalizeTime(hora)}${offset}`);

  if (Number.isNaN(instant.getTime())) {
    throw new Error(
      `Não foi possível montar instante para ${dataReferencia} ${hora}`,
    );
  }

  return instant;
}

export function inferCruzaMeiaNoite(horaInicio: string, horaFim: string): boolean {
  normalizeTime(horaInicio);
  normalizeTime(horaFim);
  return timeToMinutes(horaFim) < timeToMinutes(horaInicio);
}

export function validarHorariosEscala(horaInicio: string, horaFim: string): void {
  normalizeTime(horaInicio);
  normalizeTime(horaFim);

  if (timeToMinutes(horaInicio) === timeToMinutes(horaFim)) {
    throw new Error('Hora de início e fim não podem ser iguais');
  }
}

export function resolveJanelaPlanejada(
  input: ResolveJanelaPlanejadaInput,
): { inicioPlanejado: Date; fimPlanejado: Date } {
  const timezone = input.timezone ?? DEFAULT_TIMEZONE;

  validarHorariosEscala(input.horaInicio, input.horaFim);

  const inferred = inferCruzaMeiaNoite(input.horaInicio, input.horaFim);
  if (inferred !== input.cruzaMeiaNoite) {
    throw new Error(
      'Flag cruzaMeiaNoite inconsistente com os horários informados',
    );
  }

  const inicioPlanejado = buildInstant(
    input.dataReferencia,
    input.horaInicio,
    timezone,
  );

  const dataFim = input.cruzaMeiaNoite
    ? addDaysToDateReference(input.dataReferencia, 1)
    : input.dataReferencia;

  const fimPlanejado = buildInstant(dataFim, input.horaFim, timezone);

  if (fimPlanejado.getTime() <= inicioPlanejado.getTime()) {
    throw new Error('Janela planejada inválida: fim deve ser posterior ao início');
  }

  return { inicioPlanejado, fimPlanejado };
}

export function contemInstante(
  janela: JanelaTurno,
  instante: Date,
): boolean {
  const value = instante.getTime();
  return value >= janela.inicio.getTime() && value <= janela.fim.getTime();
}

export function duracaoMinutos(janela: JanelaTurno): number {
  return (janela.fim.getTime() - janela.inicio.getTime()) / 60_000;
}
