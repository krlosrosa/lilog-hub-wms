import { z } from 'zod';

import { usuarioPerfilSchema } from '@/features/usuarios/types/usuarios-gestao.schema';

export const unidadeAcessoNivelSchema = z.enum([
  'leitura',
  'leitura_gravacao',
  'admin_total',
]);

export type UnidadeAcessoNivel = z.infer<typeof unidadeAcessoNivelSchema>;

export const unidadeAtribuidaSchema = z.object({
  id: z.string(),
  nome: z.string().min(1),
  localizacao: z.string().min(1),
  nivelAcesso: unidadeAcessoNivelSchema,
});

export type UnidadeAtribuida = z.infer<typeof unidadeAtribuidaSchema>;

export const usuarioFormSchema = z.object({
  loginId: z
    .string()
    .min(1, 'Informe o ID de acesso')
    .regex(/^\d+$/, 'Informe um ID válido'),
  nomeCompleto: z.string().min(3, 'Informe o nome completo'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().optional(),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres').optional(),
  employeeId: z.string().min(1, 'Selecione o funcionário'),
  cargo: z.string().optional(),
  departamento: z.string().optional(),
  perfil: usuarioPerfilSchema,
  unidades: z
    .array(unidadeAtribuidaSchema)
    .min(1, 'Selecione ao menos uma unidade'),
});

export type UsuarioFormValues = z.infer<typeof usuarioFormSchema>;

export const CARGO_OPTIONS = [
  { value: 'gerente_armazem', label: 'Gerente de Armazém' },
  { value: 'analista_inventario', label: 'Analista de Inventário' },
  { value: 'diretor_operacoes', label: 'Diretor de Operações' },
  { value: 'lider_suporte', label: 'Líder de Suporte' },
] as const;

export const DEPARTAMENTO_OPTIONS = [
  { value: 'logistica', label: 'Logística' },
  { value: 'inventario', label: 'Inventário' },
  { value: 'operacoes', label: 'Operações' },
  { value: 'suporte', label: 'Suporte' },
] as const;

export const UNIDADE_ACESSO_LABELS: Record<UnidadeAcessoNivel, string> = {
  leitura: 'Apenas Leitura',
  leitura_gravacao: 'Leitura/Gravação',
  admin_total: 'Admin Total',
};

export const PERFIL_CADASTRO_OPTIONS = [
  {
    value: 'admin' as const,
    label: 'Administrador do Sistema',
    description: 'Controle total do sistema e acesso de configuração mestre',
  },
  {
    value: 'gerente' as const,
    label: 'Líder Operacional',
    description: 'Privilégios de gerenciamento de inventário e rotas',
  },
  {
    value: 'operador' as const,
    label: 'Operador Padrão',
    description: 'Acesso padrão de leitura/gravação apenas em unidades atribuídas',
  },
] as const;
