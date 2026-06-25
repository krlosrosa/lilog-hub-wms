import type {
  OrdemTabelaClientesItem,
  OrdemTabelaEmpresaItem,
} from '@/features/expedicao-impressao-config/types/carregamento-tabelas.schema';

export type LinhaTabelaEmpresaMock = Record<OrdemTabelaEmpresaItem, string>;

export type LinhaTabelaClientesMock = Record<OrdemTabelaClientesItem, string>;

export const LINHAS_TABELA_EMPRESA_MOCK: LinhaTabelaEmpresaMock[] = [
  {
    empresa: 'Nestlé',
    categoria: 'Bebidas',
    quantidade_unidade: '120',
    quantidade_caixa: '10',
    quantidade_palete: '2',
    peso: '1.250',
  },
  {
    empresa: 'Unilever',
    categoria: 'Higiene',
    quantidade_unidade: '84',
    quantidade_caixa: '7',
    quantidade_palete: '1',
    peso: '890',
  },
  {
    empresa: 'Ambev',
    categoria: 'Bebidas',
    quantidade_unidade: '240',
    quantidade_caixa: '20',
    quantidade_palete: '4',
    peso: '2.100',
  },
  {
    empresa: 'P&G',
    categoria: 'Limpeza',
    quantidade_unidade: '60',
    quantidade_caixa: '5',
    quantidade_palete: '1',
    peso: '540',
  },
];

export const LINHAS_TABELA_CLIENTES_MOCK: LinhaTabelaClientesMock[] = [
  {
    cliente: 'Atacadão Fortaleza',
    cidade: 'Fortaleza-CE',
    peso: '450',
    volume: '12.5',
    quantidade_unidade: '80',
    quantidade_caixa: '6',
    quantidade_palete: '1',
  },
  {
    cliente: 'Assaí Maracanaú',
    cidade: 'Maracanaú-CE',
    peso: '320',
    volume: '8.2',
    quantidade_unidade: '56',
    quantidade_caixa: '4',
    quantidade_palete: '1',
  },
  {
    cliente: 'Supermercado São Luiz',
    cidade: 'Fortaleza-CE',
    peso: '180',
    volume: '4.1',
    quantidade_unidade: '32',
    quantidade_caixa: '2',
    quantidade_palete: '0',
  },
  {
    cliente: 'Distribuidora Nordeste',
    cidade: 'Caucaia-CE',
    peso: '510',
    volume: '15.8',
    quantidade_unidade: '96',
    quantidade_caixa: '8',
    quantidade_palete: '2',
  },
];
