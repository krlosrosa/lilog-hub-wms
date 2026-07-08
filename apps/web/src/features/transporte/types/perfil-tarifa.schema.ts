import { z } from 'zod';

export const tipoCargaSchema = z.enum(['seco', 'refrigerado']);

export type TipoCarga = z.infer<typeof tipoCargaSchema>;

export const faixaKmFormSchema = z.object({
  kmInicial: z.coerce.number().nonnegative('Informe o km inicial'),
  kmFinal: z.coerce.number().positive('Informe o km final').nullable().optional(),
  valor: z.coerce.number().positive('Informe um valor maior que zero'),
  itinerarios: z.array(z.string().min(1)).optional(),
});

export type FaixaKmFormValues = z.infer<typeof faixaKmFormSchema>;

export const perfilTarifaFormSchema = z.object({
  nome: z.string().min(2, 'Informe o nome do perfil'),
  idRavex: z
    .number({ message: 'Informe o ID Ravex' })
    .int('ID Ravex deve ser um número inteiro')
    .positive('ID Ravex deve ser maior que zero'),
  descricao: z.string().max(500).optional(),
  peso: z
    .number({ message: 'Informe o peso máximo' })
    .positive('Informe o peso máximo'),
  cubagem: z
    .number()
    .positive('Informe a cubagem')
    .nullable()
    .optional(),
  tipoCarga: tipoCargaSchema,
});

export type PerfilTarifaFormValues = z.infer<typeof perfilTarifaFormSchema>;

export type PerfilTarifaItem = {
  id: string;
  unidadeId: string;
  idRavex: number;
  nome: string;
  descricao: string | null;
  peso: number;
  cubagem: number | null;
  tipoCarga: TipoCarga;
  faixasKm: FaixaKmItem[];
  createdAt: string;
  updatedAt: string;
};

export type ItinerarioFaixaItem = {
  id?: string;
  codigo: string;
};

export type FaixaKmItem = {
  id?: string;
  kmInicial: number;
  kmFinal: number | null;
  valor: number;
  itinerarios: ItinerarioFaixaItem[];
};

export const TIPO_CARGA_LABELS: Record<TipoCarga, string> = {
  seco: 'Carga seca',
  refrigerado: 'Refrigerado',
};

export const DEFAULT_PERFIL_TARIFA_FORM: PerfilTarifaFormValues = {
  nome: '',
  idRavex: 0,
  descricao: '',
  peso: 0,
  cubagem: undefined,
  tipoCarga: 'seco',
};

export const DEFAULT_FAIXA_KM_FORM: FaixaKmFormValues = {
  kmInicial: 0,
  kmFinal: null,
  valor: 0,
  itinerarios: [],
};

export function parseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatKmRange(kmInicial: number, kmFinal: number | null): string {
  if (kmFinal === null) {
    return `${kmInicial} km+`;
  }

  return `${kmInicial} – ${kmFinal} km`;
}
