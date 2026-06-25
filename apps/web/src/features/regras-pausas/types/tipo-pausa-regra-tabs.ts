export type TipoPausaRegra = 'termica' | 'refeicao' | 'outros';

export const TIPOS_PAUSA_REGRA: {
  id: TipoPausaRegra;
  label: string;
}[] = [
  { id: 'termica', label: 'Térmica' },
  { id: 'refeicao', label: 'Refeição' },
  { id: 'outros', label: 'Outros' },
];

export const TIPO_PAUSA_REGRA_LABELS: Record<TipoPausaRegra, string> = {
  termica: 'Térmica',
  refeicao: 'Refeição',
  outros: 'Outros',
};

export function parseTipoPausaRegra(
  value: string | null | undefined,
): TipoPausaRegra {
  if (value === 'refeicao' || value === 'outros') {
    return value;
  }
  return 'termica';
}
