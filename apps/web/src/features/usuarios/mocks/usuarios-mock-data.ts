import type { UnidadeAtribuida } from '@/features/usuarios/types/usuarios-cadastro.schema';
import type {
  PerfilPermissoes,
  PerfilRole,
  PermissaoModulo,
} from '@/features/usuarios/types/usuarios-perfis.schema';
import type {
  UsuarioKpi,
  UsuarioRecord,
} from '@/features/usuarios/types/usuarios-gestao.schema';

export const MOCK_USUARIO_KPI: UsuarioKpi = {
  totalPessoal: 1284,
  totalPessoalTrendPercent: 12.5,
  ativosAgora: 412,
  ativosPercent: 98,
  contasSinalizadas: 14,
  rotacaoSenhaPercent: 82,
};

export const MOCK_USUARIOS: UsuarioRecord[] = [
  {
    id: '1',
    nome: 'Alex Morgan',
    email: 'a.morgan@logistics.corp',
    perfil: 'admin',
    status: 'ativo',
    lastLogin: '2023-10-24 09:42',
    lastLoginIp: '192.168.1.104',
  },
  {
    id: '2',
    nome: 'Sarah Chen',
    email: 's.chen@logistics.corp',
    perfil: 'gerente',
    status: 'inativo',
    lastLogin: '2023-10-22 14:15',
    lastLoginIp: '10.0.4.52',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAI3O4aUVsdzCr4gDRWPdTILio2K0UoSGvkSCfbgLqCb1Czux5U868aRZMy2vNkAvThOwAUnr2JIqVqGYptAUqSIhxxJyPtvt2l69kDimeO0i6l9q1gMDtF0-MnLjYTd-1XuEJOzLbiBZvLoeQImr6gw3ToC1oY3nJA5MP_K72tROsZdPF8OSHCX0Vm8BxXZYgz0J8nq_8TPFQI8aYlls402HO8o1GXWKZKPwQySIaOLnLuHCNSnmdq2OI4fI3rhZlkJx5qfIfka5k',
  },
  {
    id: '3',
    nome: 'James Wilson',
    email: 'j.wilson@logistics.corp',
    perfil: 'operador',
    status: 'bloqueado',
    lastLogin: '2023-09-30 11:20',
    securityLockout: true,
  },
  {
    id: '4',
    nome: 'Linda Lopez',
    email: 'l.lopez@logistics.corp',
    perfil: 'operador',
    status: 'ativo',
    lastLogin: '2023-10-24 08:05',
    lastLoginIp: '192.168.1.112',
  },
  {
    id: '5',
    nome: 'Carlos Mendes',
    email: 'c.mendes@logistics.corp',
    perfil: 'analista',
    status: 'ativo',
    lastLogin: '2023-10-23 16:30',
    lastLoginIp: '192.168.1.88',
  },
  {
    id: '6',
    nome: 'Ana Souza',
    email: 'a.souza@logistics.corp',
    perfil: 'gerente',
    status: 'ativo',
    lastLogin: '2023-10-24 07:15',
    lastLoginIp: '10.0.4.61',
  },
];

export const STATUS_FILTRO_OPCOES = [
  { value: 'todos' as const, label: 'Todos os Usuários' },
  { value: 'ativo' as const, label: 'Ativos' },
  { value: 'inativo' as const, label: 'Inativos' },
  { value: 'bloqueado' as const, label: 'Bloqueados' },
];

export const MOCK_UNIDADES_ATRIBUIDAS: UnidadeAtribuida[] = [
  {
    id: 'u1',
    nome: 'North Hub Distribution',
    localizacao: 'Chicago, IL',
    nivelAcesso: 'leitura_gravacao',
  },
  {
    id: 'u2',
    nome: 'Western Logistics Ctr',
    localizacao: 'Denver, CO',
    nivelAcesso: 'admin_total',
  },
  {
    id: 'u3',
    nome: 'South Gate Annex',
    localizacao: 'Austin, TX',
    nivelAcesso: 'leitura',
  },
];

export const MOCK_PERFIS: PerfilRole[] = [
  {
    id: 'admin',
    label: 'Admin',
    descricao: 'Acesso total ao sistema',
    icon: 'verified_user',
    healthScore: 92,
  },
  {
    id: 'gerente',
    label: 'Gerente',
    descricao: 'Líder operacional',
    icon: 'manage_accounts',
    healthScore: 85,
  },
  {
    id: 'lider',
    label: 'Líder',
    descricao: 'Supervisão de turno e alocação de recursos',
    icon: 'supervisor_account',
    healthScore: 86,
  },
  {
    id: 'analista',
    label: 'Analista',
    descricao: 'Relatórios e Insights',
    icon: 'analytics',
    healthScore: 78,
  },
  {
    id: 'operador',
    label: 'Operador',
    descricao: 'Execução de chão de fábrica',
    icon: 'precision_manufacturing',
    healthScore: 88,
  },
];

const MODULOS_BASE: Omit<PermissaoModulo, 'permissoes'>[] = [
  {
    id: 'inventario',
    nome: 'Inventário',
    descricao: 'Listas de SKU, níveis de estoque, mapeamento de armazém',
    icon: 'inventory_2',
  },
  {
    id: 'recebimento',
    nome: 'Recebimento',
    descricao: 'Logística de entrada, verificação de Pedidos de Compra, atribuição de doca',
    icon: 'call_received',
  },
  {
    id: 'expedicao',
    nome: 'Expedição',
    descricao: 'Pedidos de saída, integração de transportadora, logs de manifesto',
    icon: 'local_shipping',
  },
  {
    id: 'relatorios',
    nome: 'Relatórios',
    descricao: 'Dashboards de KPI, produtividade de mão de obra, trilhas de auditoria',
    icon: 'description',
  },
];

function buildPermissoes(
  ver: boolean,
  criar: boolean,
  editar: boolean,
  excluir: boolean,
) {
  return { ver, criar, editar, excluir };
}

export const MOCK_PERMISSOES_POR_PERFIL: Record<
  PerfilPermissoes['perfilId'],
  PermissaoModulo[]
> = {
  admin: MODULOS_BASE.map((m) => ({
    ...m,
    permissoes: buildPermissoes(true, true, true, true),
  })),
  gerente: MODULOS_BASE.map((m) => ({
    ...m,
    permissoes: buildPermissoes(true, true, true, false),
  })),
  lider: MODULOS_BASE.map((m) => ({
    ...m,
    permissoes:
      m.id === 'relatorios'
        ? buildPermissoes(true, false, false, false)
        : buildPermissoes(true, true, true, false),
  })),
  analista: MODULOS_BASE.map((m) => ({
    ...m,
    permissoes:
      m.id === 'relatorios'
        ? buildPermissoes(true, false, true, false)
        : buildPermissoes(true, false, false, false),
  })),
  operador: MODULOS_BASE.map((m) => ({
    ...m,
    permissoes:
      m.id === 'inventario'
        ? buildPermissoes(true, true, false, false)
        : buildPermissoes(true, false, false, false),
  })),
};
