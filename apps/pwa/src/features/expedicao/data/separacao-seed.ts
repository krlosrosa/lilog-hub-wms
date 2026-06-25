import type { SeparacaoItem, SeparacaoOrder } from '../types/separacao.schema';

function buildSeparacaoItens(
  orderId: string,
  items: Array<{
    endereco: string;
    codigo: string;
    nome: string;
    caixas: number;
    unidades: number;
    status?: SeparacaoItem['status'];
    quantidadeSeparadaCaixas?: number;
    quantidadeSeparadaUnidades?: number;
  }>
): SeparacaoItem[] {
  return items.map((item, index) => ({
    id: `${orderId}-item-${index + 1}`,
    endereco: item.endereco,
    codigoProduto: item.codigo,
    nomeProduto: item.nome,
    status: item.status ?? (index === 0 ? 'em_andamento' : 'pendente'),
    sequence: index + 1,
    quantidadeSolicitadaCaixas: item.caixas,
    quantidadeSolicitadaUnidades: item.unidades,
    quantidadeSeparadaCaixas: item.quantidadeSeparadaCaixas,
    quantidadeSeparadaUnidades: item.quantidadeSeparadaUnidades,
  }));
}

export const SEED_SEPARACAO_ITENS: Record<string, SeparacaoItem[]> = {
  'SEP-2024-001': buildSeparacaoItens('SEP-2024-001', [
    { endereco: 'PA-14-01', codigo: 'SKU-882910', nome: 'Arroz Integral 5kg', caixas: 2, unidades: 0, status: 'separado' },
    { endereco: 'PA-14-02', codigo: 'SKU-441200', nome: 'Feijão Carioca 1kg', caixas: 1, unidades: 6, status: 'parcial', quantidadeSeparadaCaixas: 1, quantidadeSeparadaUnidades: 4 },
    { endereco: 'PA-14-03', codigo: 'SKU-773401', nome: 'Óleo de Soja 900ml', caixas: 3, unidades: 0, status: 'separado' },
    { endereco: 'PA-14-04', codigo: 'SKU-992100', nome: 'Açúcar Cristal 1kg', caixas: 2, unidades: 0, status: 'em_andamento' },
    { endereco: 'PA-14-05', codigo: 'SKU-331800', nome: 'Café Torrado 500g', caixas: 1, unidades: 0 },
    { endereco: 'PA-14-06', codigo: 'SKU-556700', nome: 'Leite UHT 1L', caixas: 4, unidades: 0 },
    { endereco: 'PA-14-07', codigo: 'SKU-224500', nome: 'Macarrão Espaguete 500g', caixas: 2, unidades: 0 },
    { endereco: 'PA-14-08', codigo: 'SKU-667300', nome: 'Sal Refinado 1kg', caixas: 1, unidades: 0 },
  ]),
  'SEP-2024-002': buildSeparacaoItens('SEP-2024-002', [
    { endereco: 'PB-22-01', codigo: 'SKU-110200', nome: 'Detergente Líquido 500ml', caixas: 2, unidades: 0, status: 'em_andamento' },
    { endereco: 'PB-22-02', codigo: 'SKU-110201', nome: 'Sabão em Pó 1kg', caixas: 1, unidades: 0 },
    { endereco: 'PB-22-03', codigo: 'SKU-110202', nome: 'Amaciante 2L', caixas: 3, unidades: 0 },
    { endereco: 'PB-22-04', codigo: 'SKU-110203', nome: 'Desinfetante 1L', caixas: 2, unidades: 0 },
    { endereco: 'PB-22-05', codigo: 'SKU-110204', nome: 'Esponja de Aço', caixas: 0, unidades: 12 },
    { endereco: 'PB-22-06', codigo: 'SKU-110205', nome: 'Papel Higiênico 12un', caixas: 4, unidades: 0 },
  ]),
  'SEP-2024-003': buildSeparacaoItens('SEP-2024-003', [
    { endereco: 'CR-01-01', codigo: 'SKU-880100', nome: 'Sorvete Chocolate 2L', caixas: 2, unidades: 0, status: 'separado' },
    { endereco: 'CR-01-02', codigo: 'SKU-880101', nome: 'Peixe Congelado 1kg', caixas: 1, unidades: 0, status: 'separado' },
    { endereco: 'CR-01-03', codigo: 'SKU-880102', nome: 'Hambúrguer 672g', caixas: 3, unidades: 0, status: 'separado' },
    { endereco: 'CR-01-04', codigo: 'SKU-880103', nome: 'Batata Congelada 2kg', caixas: 2, unidades: 0, status: 'separado' },
    { endereco: 'CR-01-05', codigo: 'SKU-880104', nome: 'Polpa de Açaí 1kg', caixas: 1, unidades: 0, status: 'em_andamento' },
  ]),
  'SEP-2024-004': buildSeparacaoItens('SEP-2024-004', [
    { endereco: 'BS-02-01', codigo: 'SKU-550100', nome: 'Cimento 50kg', caixas: 10, unidades: 0, status: 'separado' },
    { endereco: 'BS-02-02', codigo: 'SKU-550101', nome: 'Tinta Acrílica 18L', caixas: 2, unidades: 0, status: 'separado' },
    { endereco: 'BS-02-03', codigo: 'SKU-550102', nome: 'Parafuso 6x50mm cx', caixas: 1, unidades: 0, status: 'em_andamento' },
    { endereco: 'BS-02-04', codigo: 'SKU-550103', nome: 'Fita Crepe 48mm', caixas: 0, unidades: 24 },
    { endereco: 'BS-02-05', codigo: 'SKU-550104', nome: 'Lixa 120', caixas: 0, unidades: 50 },
    { endereco: 'BS-02-06', codigo: 'SKU-550105', nome: 'Broca 8mm', caixas: 0, unidades: 10 },
    { endereco: 'BS-02-07', codigo: 'SKU-550106', nome: 'Silicone Transparente', caixas: 2, unidades: 0 },
  ]),
  'SEP-2024-005': buildSeparacaoItens('SEP-2024-005', [
    { endereco: 'PA-08-01', codigo: 'SKU-770100', nome: 'Refrigerante 2L', caixas: 6, unidades: 0, status: 'em_andamento' },
    { endereco: 'PA-08-02', codigo: 'SKU-770101', nome: 'Suco Integral 1L', caixas: 4, unidades: 0 },
    { endereco: 'PA-08-03', codigo: 'SKU-770102', nome: 'Água Mineral 500ml', caixas: 8, unidades: 0 },
    { endereco: 'PA-08-04', codigo: 'SKU-770103', nome: 'Energético 250ml', caixas: 2, unidades: 0 },
    { endereco: 'PA-08-05', codigo: 'SKU-770104', nome: 'Chá Mate 1L', caixas: 3, unidades: 0 },
  ]),
};

export const SEED_SEPARACAO_ORDERS: SeparacaoOrder[] = [
  {
    id: '#SEP-2024-001',
    routeId: 'SEP-2024-001',
    destino: 'Doca 1',
    zona: 'Picking A',
    priority: 'urgente',
    isPriority: true,
    itemCount: 8,
    pickedCount: 3,
  },
  {
    id: '#SEP-2024-002',
    routeId: 'SEP-2024-002',
    destino: 'Doca 3',
    zona: 'Picking B',
    priority: 'normal',
    itemCount: 6,
    pickedCount: 0,
    timeAgo: '45 min atrás',
  },
  {
    id: '#SEP-2024-003',
    routeId: 'SEP-2024-003',
    destino: 'Doca 5',
    zona: 'Cold Room',
    priority: 'urgente',
    isPriority: true,
    itemCount: 5,
    pickedCount: 4,
    tag: 'Express',
  },
  {
    id: '#SEP-2024-004',
    routeId: 'SEP-2024-004',
    destino: 'Doca 2',
    zona: 'Bulk Storage',
    priority: 'normal',
    itemCount: 7,
    pickedCount: 2,
  },
  {
    id: '#SEP-2024-005',
    routeId: 'SEP-2024-005',
    destino: 'Doca 4',
    zona: 'Picking A',
    priority: 'normal',
    itemCount: 5,
    pickedCount: 0,
    tag: 'Retrabalho',
  },
];
