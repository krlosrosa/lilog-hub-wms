import { z } from 'zod';

export const centroOrigemFormSchema = z.object({
  centro: z.string().min(1, 'Informe o código do centro').max(50),
  nome: z.string().min(1, 'Informe o nome').max(255),
});

export type CentroOrigemFormValues = z.infer<typeof centroOrigemFormSchema>;

export const CENTRO_ORIGEM_FORM_DEFAULT_VALUES: CentroOrigemFormValues = {
  centro: '',
  nome: '',
};

export type CentroOrigemListaItem = {
  centro: string;
  nome: string;
};
