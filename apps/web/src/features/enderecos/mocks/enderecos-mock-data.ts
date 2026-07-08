import type {
  EnderecoKpi,
  EnderecoListaItem,
  EnderecoStatus,
  EnderecoTipo,
} from '@/features/enderecos/types/enderecos-gestao.schema';

export const MOCK_ENDERECO_KPI: EnderecoKpi = {
  totalEnderecos: 40,
  totalEnderecosTrendPercent: 2.4,
  ocupacaoGlobalPercent: 42.5,
  posicoesBloqueadas: 4,
  crossDockingAtivos: 4,
  enderecosDisponiveis: 24,
  enderecosOcupados: 8,
  taxaOcupacaoGeral: 42.5,
};

export const MOCK_ENDERECOS: EnderecoListaItem[] = [
  {
    id: '1',
    enderecoId: 'A 001 0001 01',
    zona: 'A',
    rua: '001',
    posicao: '0001',
    nivel: '01',
    tipo: 'picking',
    status: 'ocupado',
    capacidadeKg: 500,
    ocupacaoPercent: 78,
    curvaAbc: 'A',
  },
  {
    id: '2',
    enderecoId: 'A 002 0001 01',
    zona: 'A',
    rua: '002',
    posicao: '0001',
    nivel: '01',
    tipo: 'pulmao',
    status: 'disponivel',
    capacidadeKg: 2000,
    ocupacaoPercent: 0,
    curvaAbc: 'B',
  },
  {
    id: '3',
    enderecoId: 'B 005 0010 03',
    zona: 'B',
    rua: '005',
    posicao: '0010',
    nivel: '03',
    tipo: 'recebimento',
    status: 'bloqueado',
    capacidadeKg: 800,
    ocupacaoPercent: 0,
    curvaAbc: 'B',
  },
  {
    id: '4',
    enderecoId: 'C 010 0050 10',
    zona: 'C',
    rua: '010',
    posicao: '0050',
    nivel: '10',
    tipo: 'expedicao',
    status: 'disponivel',
    capacidadeKg: 700,
    ocupacaoPercent: 0,
    curvaAbc: 'C',
  },
  {
    id: '5',
    enderecoId: 'D 003 0001 01',
    zona: 'D',
    rua: '003',
    posicao: '0001',
    nivel: '01',
    tipo: 'inventario',
    status: 'inventario',
    capacidadeKg: 500,
    ocupacaoPercent: 0,
    curvaAbc: 'B',
  },
];

export const ZONA_FILTRO_OPCOES = ['A', 'B', 'C', 'D'] as const;

export const NIVEIS_OPCOES = ['01', '02', '03', '10'] as const;

export const TIPO_FILTRO_OPCOES = [
  { value: 'picking' as const, label: 'Picking' },
  { value: 'pulmao' as const, label: 'Pulmão' },
  { value: 'aereo' as const, label: 'Aéreo' },
  { value: 'recebimento' as const, label: 'Recebimento' },
  { value: 'expedicao' as const, label: 'Expedição' },
  { value: 'cross_docking' as const, label: 'Cross Docking' },
  { value: 'avaria' as const, label: 'Avaria' },
  { value: 'inventario' as const, label: 'Inventário' },
  { value: 'area_operacional' as const, label: 'Área Operacional' },
] as const;

export const STATUS_FILTRO_OPCOES: ReadonlyArray<{
  value: EnderecoStatus;
  label: string;
}> = [
  { value: 'disponivel', label: 'Disponível' },
  { value: 'ocupado', label: 'Ocupado' },
  { value: 'bloqueado', label: 'Bloqueado' },
  { value: 'inventario', label: 'Inventário' },
  { value: 'inativo', label: 'Inativo' },
];

export const STATUS_FILTRO_TONE: Record<
  EnderecoStatus,
  { active: string; inactive: string }
> = {
  disponivel: {
    active: 'border border-primary/30 bg-primary/10 text-primary',
    inactive: 'border border-outline-variant bg-surface-highest text-foreground hover:bg-muted',
  },
  ocupado: {
    active: 'border border-tertiary/30 bg-tertiary-container/20 text-tertiary',
    inactive: 'border border-outline-variant bg-surface-highest text-foreground hover:bg-muted',
  },
  bloqueado: {
    active: 'border border-destructive/30 bg-destructive/10 text-destructive',
    inactive: 'border border-outline-variant bg-surface-highest text-foreground hover:bg-muted',
  },
  inventario: {
    active: 'border border-secondary/30 bg-secondary/10 text-secondary',
    inactive: 'border border-outline-variant bg-surface-highest text-foreground hover:bg-muted',
  },
  inativo: {
    active: 'border border-muted-foreground/30 bg-muted text-muted-foreground',
    inactive: 'border border-outline-variant bg-surface-highest text-foreground hover:bg-muted',
  },
};

export type EnderecoTipoFiltro = EnderecoTipo;
