import type { ProdutoResult } from '../types/consulta-produto.schema';

export const SEED_CONSULTA_PRODUTO: ProdutoResult = {
  id: '982341',
  nome: 'Picanha Premium',
  sku: 'SKU-7821-B',
  categoria: 'Premium Cold Chain',
  estoqueTotal: 150,
  reservado: 12,
  unidade: 'CX',
  localizacoes: [
    {
      id: 'loc-1',
      endereco: 'A-102-04',
      zona: 'ZONA A',
      tipo: 'picking',
      quantidade: 42,
      lote: 'L-2024-001',
      status: 'normal',
    },
    {
      id: 'loc-2',
      endereco: 'A-102-05',
      zona: 'PICKING',
      tipo: 'picking',
      quantidade: 8,
      status: 'critico',
      alertaLabel: 'Baixo estoque',
      ordemRessuprimento: {
        ordemId: 'ORD-RESSUP-2847',
      },
    },
    {
      id: 'loc-3',
      endereco: 'B-201-12',
      zona: 'ZONA B',
      tipo: 'aereo',
      quantidade: 65,
      lote: 'L-2024-002',
      status: 'normal',
    },
    {
      id: 'loc-4',
      endereco: 'C-304-01',
      zona: 'ZONA C',
      tipo: 'aereo',
      quantidade: 35,
      lote: 'L-2024-001',
      status: 'normal',
    },
  ],
};

export const CONSULTA_PRODUTO_SKUS: Record<string, ProdutoResult> = {
  'sku-7821-b': SEED_CONSULTA_PRODUTO,
  '7821': SEED_CONSULTA_PRODUTO,
  '982341': SEED_CONSULTA_PRODUTO,
  picanha: SEED_CONSULTA_PRODUTO,
};
