import { z } from 'zod';

import { enderecoConfiguracaoFormSchema } from '@/features/enderecos/types/enderecos-configuracao.schema';

export const enderecoCadastroFormSchema = enderecoConfiguracaoFormSchema.omit({
  enderecoMascarado: true,
  motivoAlteracao: true,
});

export type EnderecoCadastroFormValues = z.infer<typeof enderecoCadastroFormSchema>;

export const ENDERECO_CADASTRO_DEFAULT_VALUES: EnderecoCadastroFormValues = {
  centroId: '',
  zona: 'A',
  rua: '0001',
  posicao: '001',
  nivel: '01',
  tipo: 'picking',
  tipoEstrutura: 'porta-palete',
  larguraMm: 1200,
  alturaMm: 1500,
  profundidadeMm: 1000,
  cargaMaxKg: 1500,
  vinculoSkuFixo: false,
  regraLoteUnico: false,
  permiteMisturaValidade: false,
  permiteFracionado: false,
  curvaAbc: 'B',
};
