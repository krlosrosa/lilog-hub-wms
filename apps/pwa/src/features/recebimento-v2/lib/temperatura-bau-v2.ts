import { recebimentoV2Db } from '../local-db/db';

export const TEMPERATURA_BAU_ETAPAS = ['inicio', 'meio', 'fim'] as const;

export type TemperaturaEtapaV2 = (typeof TEMPERATURA_BAU_ETAPAS)[number];

export const TOTAL_TEMPERATURA_BAU_ETAPAS = TEMPERATURA_BAU_ETAPAS.length;

export const TEMPERATURA_BAU_ETAPA_LABELS: Record<TemperaturaEtapaV2, string> = {
  inicio: 'Início do baú',
  meio: 'Meio do baú',
  fim: 'Fim do baú',
};

export const TEMPERATURAS_BAU_INCOMPLETAS_MSG =
  'Informe as temperaturas de início, meio e fim do baú antes de finalizar a conferência.';

type TemperaturaLike = {
  etapa: string;
  temperatura: number | null | undefined;
};

export function countTemperaturasPreenchidas(
  records: TemperaturaLike[] | undefined,
): number {
  const filled = new Set(
    (records ?? [])
      .filter(
        (record) =>
          record.temperatura != null && !Number.isNaN(Number(record.temperatura)),
      )
      .map((record) => record.etapa),
  );

  return TEMPERATURA_BAU_ETAPAS.filter((etapa) => filled.has(etapa)).length;
}

export function areTemperaturasBauCompletas(
  records: TemperaturaLike[] | undefined,
): boolean {
  return countTemperaturasPreenchidas(records) === TOTAL_TEMPERATURA_BAU_ETAPAS;
}

export async function assertTemperaturasBauCompletas(demandId: string): Promise<void> {
  const records = await recebimentoV2Db.temperatures
    .where('demandId')
    .equals(demandId)
    .toArray();

  if (!areTemperaturasBauCompletas(records)) {
    throw new Error(TEMPERATURAS_BAU_INCOMPLETAS_MSG);
  }
}
