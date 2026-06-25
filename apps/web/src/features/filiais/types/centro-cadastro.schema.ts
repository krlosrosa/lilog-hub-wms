import { z } from 'zod';

export const empresaOptionValues = ['ITB', 'DPA', 'LDB'] as const;

export type EmpresaCodigo = (typeof empresaOptionValues)[number];

export const empresaOptions = [
  { value: 'ITB' as const, label: 'ITB - Itambé' },
  { value: 'DPA' as const, label: 'DPA - DPA' },
  { value: 'LDB' as const, label: 'LDB - Lactalis' },
];

export function labelEmpresa(codigo: EmpresaCodigo): string {
  return empresaOptions.find((o) => o.value === codigo)?.label ?? codigo;
}

export const centroCadastroSchema = z.object({
  centro: z
    .string()
    .trim()
    .length(4, 'Centro deve ter exatamente 4 dígitos')
    .regex(/^\d{4}$/, 'Centro deve conter apenas números'),
  nome: z.string().trim().min(1, 'Informe o nome'),
  empresa: z.enum(empresaOptionValues, {
    message: 'Selecione a empresa',
  }),
});

export type CentroCadastroFormValues = z.infer<typeof centroCadastroSchema>;
