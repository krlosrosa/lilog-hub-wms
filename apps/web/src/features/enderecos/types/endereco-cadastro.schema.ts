import { z } from 'zod';

import {
  applyEnderecoEstruturaRefinement,
  enderecoConfiguracaoBaseObjectSchema,
} from '@/features/enderecos/types/enderecos-configuracao.schema';
import {
  ENDERECO_DIMENSOES_RACK_DEFAULT,
  getDefaultTipoEstrutura,
} from '@/features/enderecos/types/enderecos-gestao.schema';

export const enderecoCadastroFormSchema = applyEnderecoEstruturaRefinement(
  enderecoConfiguracaoBaseObjectSchema.omit({
    enderecoMascarado: true,
    motivoAlteracao: true,
  }),
);

export type EnderecoCadastroFormValues = z.infer<typeof enderecoCadastroFormSchema>;

export const ENDERECO_CADASTRO_DEFAULT_VALUES: EnderecoCadastroFormValues = {
  zona: 'A',
  rua: '001',
  posicao: '0001',
  nivel: '01',
  tipo: 'picking',
  tipoEstrutura: getDefaultTipoEstrutura('picking'),
  ...ENDERECO_DIMENSOES_RACK_DEFAULT,
  vinculoSkuFixo: false,
  regraLoteUnico: false,
  permiteMisturaValidade: false,
  permiteFracionado: false,
  curvaAbc: 'B',
};
