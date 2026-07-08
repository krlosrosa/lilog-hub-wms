import type { ProdutoListaItem } from '@/features/produto/types/produto-lista.schema';

/** Mock seed até existir API. */
export const MOCK_PRODUTOS: ProdutoListaItem[] = [
  {
    produtoId: '1',
    sku: 'FR-7829-X',
    descricao: 'Café Premium Gourmet 500g',
    subtitulo: 'PVAR • Seco',
    ean: '7891020304051',
    categoria: 'seco',
    empresa: 'LDB - Lactalis',
  },
  {
    produtoId: '2',
    sku: 'FR-1244-B',
    descricao: 'Leite UHT Integral 1L',
    subtitulo: 'PVAR • Refrigerado',
    ean: '7899988776655',
    categoria: 'refrigerado',
    empresa: 'ITB - Itambé',
  },
  {
    produtoId: '3',
    sku: 'FR-5501-L',
    descricao: 'Queijo Minas Padrão 500g',
    subtitulo: 'PPAR • Queijo',
    ean: '4002892210045',
    categoria: 'queijo',
    empresa: 'DPA - DPA',
  },
];
