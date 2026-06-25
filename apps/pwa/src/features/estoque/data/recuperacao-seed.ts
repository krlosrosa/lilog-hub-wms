import type {
  RecuperacaoDemanda,
  RecuperacaoItem,
} from '../types/recuperacao.schema';

const FOTO_ANTES_GERAL: RecuperacaoItem['fotosAntes'][number] = {
  id: 'foto-geral',
  url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7A1OsVO8JRxSeUFh6NXR2VLuLlmVJeUiF4WQwkfuGdfOdF2ezEA7fgvQckNE6YuMr9YZwlsx_Z5Ic6pKcH5qBmsjAXVRkfspUaqiru85VXR3NlXKE-ECujFLk-dWxLkpkT9PcXEvQg7rT4BwGIR5Dgn95Vu0r3xbw9LkvQk0REb8XW0ZlwRofnNT4kjDN7xluTtXaShjmx2_boehGa9ToOGdLTdCg0aY6_N0MD83PDFLaKRFw_ejlTdaIpcPuB-4wLDMeZxfc7Inp',
  label: 'Geral',
};

const FOTO_ANTES_DETALHE: RecuperacaoItem['fotosAntes'][number] = {
  id: 'foto-detalhe',
  url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgT7DWT2zY0Yak24yRDiUSDJZCVrRTg_JLx8i4q2FUl15hQH52A1G7NZmfqB8FxavAqUp6k8xqNx6QEiYdyalZYbRqxKjkxuvhsfpzExOt8DbrjcLxE3Sd8zMphX2yQ8e0ueg_8-biO_j3jFb1PjLETa6op1n5jTzMT0hLRnIs8LI3dzVH2bg5Z3TvQdQCNYPTJKXB5UPoJ0jrcvZwSUPyCag0aVeME86CoNVBfId4t6D2XUpKxpTfgyQVfvokEWn16C1JXoKN5vrz',
  label: 'Detalhado',
};

export const SEED_RECUPERACAO_DEMANDS: RecuperacaoDemanda[] = [
  {
    id: 'REC-10234',
    titulo: 'Vinho Reserva 750ml',
    status: 'pendente',
    prioridade: 'alta',
    motivoAvaria: 'Embalagem Rasgada',
    localizacao: 'A-102-04',
    quantidadeTotal: 50,
    dataAbertura: '14/10/2023',
    totalSkus: 4,
  },
  {
    id: 'REC-10235',
    titulo: 'Azeite Extra Virgem',
    status: 'pendente',
    prioridade: 'media',
    motivoAvaria: 'Etiqueta Ilegível',
    localizacao: 'B-205-01',
    quantidadeTotal: 50,
    dataAbertura: '15/10/2023',
    totalSkus: 3,
  },
  {
    id: 'REC-10238',
    titulo: 'Caixa Papelão G',
    status: 'pendente',
    prioridade: 'baixa',
    motivoAvaria: 'Avaria de Suporte',
    localizacao: 'Z-001-02',
    quantidadeTotal: 100,
    dataAbertura: '16/10/2023',
    totalSkus: 2,
  },
  {
    id: 'REC-10220',
    titulo: 'Console Games V2',
    status: 'em_execucao',
    prioridade: 'alta',
    motivoAvaria: 'Re-embalagem',
    localizacao: 'C-301-08',
    quantidadeTotal: 80,
    dataAbertura: '12/10/2023',
    progressoPercent: 65,
    operador: 'João S.',
    totalSkus: 5,
  },
  {
    id: 'REC-10190',
    titulo: 'Lote Refrigerados Q3',
    status: 'finalizada',
    prioridade: 'alta',
    motivoAvaria: 'Caixa Amassada',
    localizacao: 'A-102-04',
    quantidadeTotal: 150,
    dataAbertura: '10/10/2023',
    progressoPercent: 100,
    operador: 'Maria L.',
    totalSkus: 5,
  },
];

export const SEED_RECUPERACAO_ITENS: RecuperacaoItem[] = [
  {
    id: 'item-10234-1',
    demandaId: 'REC-10234',
    sku: '88291-BR',
    nome: 'Vinho Reserva 750ml',
    quantidadeRecuperar: 12,
    motivoAvaria: 'Embalagem Rasgada',
    lote: 'LT-2023-A9',
    validade: '12/10/2024',
    descricaoAvaria:
      'Caixas na base do pallet amassadas por excesso de peso durante o transporte inter-unidades.',
    fotosAntes: [FOTO_ANTES_GERAL, FOTO_ANTES_DETALHE],
    status: 'pendente',
    instrucaoTrabalho:
      'Instrução: Reembalar itens e reetiquetar para retorno ao estoque.',
    enderecoEsperado: 'A-102-04',
  },
  {
    id: 'item-10234-2',
    demandaId: 'REC-10234',
    sku: '45120-PT',
    nome: 'Azeite de Oliva Extra Virgem',
    quantidadeRecuperar: 6,
    motivoAvaria: 'Vazamento Detectado',
    lote: 'LT-2023-B2',
    validade: '06/08/2025',
    fotosAntes: [FOTO_ANTES_GERAL],
    status: 'pendente',
    instrucaoTrabalho:
      'Instrução: Isolar itens com vazamento e reembalar unidades íntegras.',
    enderecoEsperado: 'A-102-04',
  },
  {
    id: 'item-10234-3',
    demandaId: 'REC-10234',
    sku: '11094-CH',
    nome: 'Chocolate Amargo 85%',
    quantidadeRecuperar: 24,
    motivoAvaria: 'Caixa Amassada',
    lote: 'LT-2023-C1',
    validade: '20/03/2025',
    fotosAntes: [FOTO_ANTES_DETALHE],
    status: 'pendente',
    instrucaoTrabalho:
      'Instrução: Reembalar itens e reetiquetar para retorno ao estoque.',
    enderecoEsperado: 'A-102-04',
  },
  {
    id: 'item-10234-4',
    demandaId: 'REC-10234',
    sku: '67332-BR',
    nome: 'Café Gourmet Moído',
    quantidadeRecuperar: 8,
    motivoAvaria: 'Lacre Violado',
    lote: 'LT-2023-D4',
    validade: '01/12/2024',
    fotosAntes: [FOTO_ANTES_GERAL],
    status: 'pendente',
    instrucaoTrabalho:
      'Instrução: Verificar integridade e reembalar para estoque.',
    enderecoEsperado: 'A-102-04',
  },
  {
    id: 'item-10234-5',
    demandaId: 'REC-10234',
    sku: 'SKU-7821-B',
    nome: 'Picanha Premium',
    quantidadeRecuperar: 20,
    motivoAvaria: 'Caixa Amassada',
    lote: 'LT-2023-A9',
    validade: '12/10/2024',
    temperatura: 'RESFRIADO',
    descricaoAvaria:
      'Caixas na base do pallet amassadas por excesso de peso durante o transporte inter-unidades.',
    fotosAntes: [FOTO_ANTES_GERAL, FOTO_ANTES_DETALHE],
    status: 'pendente',
    instrucaoTrabalho:
      'Instrução: Reembalar itens e reetiquetar para retorno ao estoque.',
    enderecoEsperado: 'A-102-04',
  },
  {
    id: 'item-10235-1',
    demandaId: 'REC-10235',
    sku: '45120-PT',
    nome: 'Azeite Extra Virgem 500ml',
    quantidadeRecuperar: 30,
    motivoAvaria: 'Etiqueta Ilegível',
    lote: 'LT-2023-E1',
    validade: '15/06/2025',
    fotosAntes: [FOTO_ANTES_GERAL],
    status: 'pendente',
    instrucaoTrabalho: 'Instrução: Reetiquetar itens para retorno ao estoque.',
    enderecoEsperado: 'B-205-01',
  },
  {
    id: 'item-10220-1',
    demandaId: 'REC-10220',
    sku: 'IND-9923-X1',
    nome: 'Monitor Industrial 24"',
    quantidadeRecuperar: 20,
    motivoAvaria: 'Re-embalagem',
    lote: 'LT-2023-F2',
    validade: '31/12/2026',
    fotosAntes: [FOTO_ANTES_GERAL],
    status: 'em_execucao',
    instrucaoTrabalho:
      'Instrução: Reembalar itens e reetiquetar para retorno ao estoque.',
    enderecoEsperado: 'C-301-08',
  },
];

export function getRecuperacaoDemandaById(
  demandaId: string,
): RecuperacaoDemanda | undefined {
  return SEED_RECUPERACAO_DEMANDS.find((d) => d.id === demandaId);
}

export function getRecuperacaoItensByDemandaId(
  demandaId: string,
): RecuperacaoItem[] {
  return SEED_RECUPERACAO_ITENS.filter((i) => i.demandaId === demandaId);
}

export function getRecuperacaoItemById(
  itemId: string,
): RecuperacaoItem | undefined {
  return SEED_RECUPERACAO_ITENS.find((i) => i.id === itemId);
}
