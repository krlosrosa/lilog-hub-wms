import { z } from 'zod';

export const clienteEspecialFormSchema = z.object({
  codCliente: z.string().min(1, 'Informe o código do cliente').max(50),
  nomeCliente: z.string().min(1, 'Informe o nome do cliente').max(255),
  ativo: z.boolean(),
  exigeSegregacaoMapa: z.boolean(),
  exigeSeparacaoEspecial: z.boolean(),
  exigeCarregamentoEspecial: z.boolean(),
  observacaoSeparacao: z.string().max(2000).optional(),
  observacaoCarregamento: z.string().max(2000).optional(),
  observacaoGeral: z.string().max(2000).optional(),
});

export type ClienteEspecialFormValues = z.infer<typeof clienteEspecialFormSchema>;

export const CLIENTE_ESPECIAL_FORM_DEFAULT_VALUES: ClienteEspecialFormValues = {
  codCliente: '',
  nomeCliente: '',
  ativo: true,
  exigeSegregacaoMapa: false,
  exigeSeparacaoEspecial: false,
  exigeCarregamentoEspecial: false,
  observacaoSeparacao: '',
  observacaoCarregamento: '',
  observacaoGeral: '',
};

export type ClienteEspecialApi = {
  id: string;
  unidadeId: string;
  codCliente: string;
  nomeCliente: string;
  ativo: boolean;
  exigeSegregacaoMapa: boolean;
  exigeSeparacaoEspecial: boolean;
  exigeCarregamentoEspecial: boolean;
  observacaoSeparacao: string | null;
  observacaoCarregamento: string | null;
  observacaoGeral: string | null;
  criadoPor: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ListClientesEspeciaisApiResponse = {
  items: ClienteEspecialApi[];
  total: number;
  page: number;
  limit: number;
};

export type ClienteEspecialListaItem = {
  id: string;
  codCliente: string;
  nomeCliente: string;
  ativo: boolean;
  exigeSegregacaoMapa: boolean;
  exigeSeparacaoEspecial: boolean;
  exigeCarregamentoEspecial: boolean;
};

export type FiltroClienteEspecialAtivo = 'todos' | 'ativos' | 'inativos';
