import { z } from 'zod';

export const CRITERIO_TIPO_OPTIONS = [
  { value: 'grupo', label: 'Grupo de produto' },
  { value: 'categoria', label: 'Categoria' },
  { value: 'produto', label: 'Produto específico' },
] as const;

export const DESTINO_TIPO_OPTIONS = [
  { value: 'zona', label: 'Zona / Corredor' },
  { value: 'endereco', label: 'Endereço específico' },
] as const;

export const regraDestinoFormSchema = z
  .object({
    prioridade: z.number().int().min(1),
    tipo: z.enum(['zona', 'endereco']),
    zona: z.string().optional(),
    rua: z.string().optional(),
    enderecoId: z.string().uuid().optional(),
    ativo: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (
      value.tipo === 'zona' &&
      !value.zona?.trim() &&
      !value.rua?.trim()
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selecione a zona ou o corredor',
        path: ['zona'],
      });
    }

    if (value.tipo === 'endereco' && !value.enderecoId) {
      ctx.addIssue({
        code: 'custom',
        message: 'Selecione o endereço',
        path: ['enderecoId'],
      });
    }
  });

export const regraEnderecamentoFormSchema = z.object({
  nome: z.string().min(1, 'Informe o nome da regra').max(100),
  criterioTipo: z.enum(['grupo', 'categoria', 'produto']),
  criterioValor: z.string().min(1, 'Informe o valor do critério').max(100),
  prioridade: z.number().int().min(1),
  ativo: z.boolean(),
  destinos: z.array(regraDestinoFormSchema).min(1, 'Adicione ao menos um destino'),
});

export type RegraDestinoFormValues = z.infer<typeof regraDestinoFormSchema>;
export type RegraEnderecamentoFormValues = z.infer<
  typeof regraEnderecamentoFormSchema
>;

export type RegraEnderecamentoListaItem = {
  id: string;
  nome: string;
  criterioTipo: RegraEnderecamentoFormValues['criterioTipo'];
  criterioValor: string;
  prioridade: number;
  ativo: boolean;
  destinos: Array<{
    id?: string;
    prioridade: number;
    tipo: RegraDestinoFormValues['tipo'];
    zona: string | null;
    rua: string | null;
    enderecoId: string | null;
    enderecoLabel: string | null;
    ativo: boolean;
  }>;
  createdAt: string;
};

export const DEFAULT_DESTINO_FORM_VALUES: RegraDestinoFormValues = {
  prioridade: 1,
  tipo: 'zona',
  zona: '',
  rua: '',
  ativo: true,
};

export const DEFAULT_REGRA_FORM_VALUES: RegraEnderecamentoFormValues = {
  nome: '',
  criterioTipo: 'grupo',
  criterioValor: '',
  prioridade: 10,
  ativo: true,
  destinos: [{ ...DEFAULT_DESTINO_FORM_VALUES }],
};

export function getCriterioTipoLabel(
  tipo: RegraEnderecamentoFormValues['criterioTipo'],
): string {
  return CRITERIO_TIPO_OPTIONS.find((option) => option.value === tipo)?.label ?? tipo;
}

export function getDestinoTipoLabel(tipo: RegraDestinoFormValues['tipo']): string {
  return DESTINO_TIPO_OPTIONS.find((option) => option.value === tipo)?.label ?? tipo;
}
