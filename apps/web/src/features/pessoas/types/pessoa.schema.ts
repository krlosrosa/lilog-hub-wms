import {
  FUNCIONARIO_CARGO_LABELS,
  FUNCIONARIO_CARGO_OPTIONS,
  FuncionarioCargoSchema,
  type FuncionarioCargo,
} from '@lilog/contracts';
import { z } from 'zod';

export const pessoaCargoSchema = FuncionarioCargoSchema;

export type PessoaCargo = FuncionarioCargo;

export const pessoaPerfilSchema = z.enum(['admin', 'lider', 'operador']);

export type PessoaPerfil = z.infer<typeof pessoaPerfilSchema>;

export const pessoaFormSchema = z.object({
  matricula: z
    .string()
    .min(1, 'Informe a matrícula/ID')
    .regex(/^\d+$/, 'Informe um ID numérico (ex: 421931)'),
  nomeCompleto: z.string().min(3, 'Informe o nome completo'),
  cargo: pessoaCargoSchema,
  equipeId: z
    .string()
    .min(1, 'Selecione um departamento')
    .uuid('Selecione um departamento'),
  dataAdmissao: z.string().min(1, 'Informe a data de admissão'),
  unidadeId: z.string().min(1, 'Selecione uma unidade'),
  concederAcesso: z.boolean(),
  role: pessoaPerfilSchema.optional(),
  senha: z.string().optional(),
  email: z.string().optional(),
});

export type PessoaFormValues = z.infer<typeof pessoaFormSchema>;

export const CARGO_OPTIONS = FUNCIONARIO_CARGO_OPTIONS;
export const CARGO_LABELS = FUNCIONARIO_CARGO_LABELS;

export const PERFIL_OPTIONS: Array<{
  value: PessoaPerfil;
  label: string;
  description: string;
}> = [
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Controle total do sistema e configurações',
  },
  {
    value: 'lider',
    label: 'Líder Operacional',
    description: 'Acesso ao painel PWA de liderança e gestão do turno',
  },
  {
    value: 'operador',
    label: 'Operador',
    description: 'Acesso operacional nas unidades atribuídas',
  },
];

export type PessoaSituacaoUi = 'ativo' | 'inativo' | 'bloqueado';

export type PessoaAcessoUi =
  | 'sem_acesso'
  | 'ativo'
  | 'bloqueado'
  | 'pendente'
  | 'inativo';

export type PessoaRecord = {
  id: string;
  funcionarioId: number;
  matricula: string;
  nome: string;
  cargo: string;
  situacao: PessoaSituacaoUi;
  unidadeId: string;
  equipeId: string | null;
  equipeNome: string | null;
  acesso: PessoaAcessoUi;
  perfil: PessoaPerfil | null;
  userId: number | null;
};

export type PessoaKpi = {
  total: number;
  ativosOperacionais: number;
  comAcesso: number;
  bloqueados: number;
};

export type PessoaFiltroSituacao = 'todos' | 'ativo' | 'inativo';

export type PessoaFiltroAcesso = 'todos' | 'com_acesso' | 'sem_acesso';

export type PessoaFiltroEquipe = 'todos' | 'sem_equipe' | string;

export type PessoaFiltroCargo = 'todos' | PessoaCargo;

export const PESSOA_SITUACAO_LABELS: Record<PessoaSituacaoUi, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  bloqueado: 'Bloqueado',
};

export const PESSOA_ACESSO_LABELS: Record<PessoaAcessoUi, string> = {
  sem_acesso: 'Sem acesso',
  ativo: 'Ativo',
  bloqueado: 'Bloqueado',
  pendente: 'Pendente',
  inativo: 'Inativo',
};

export const PESSOA_PERFIL_LABELS: Record<PessoaPerfil, string> = {
  admin: 'Admin',
  lider: 'Líder Operacional',
  operador: 'Operador',
};
