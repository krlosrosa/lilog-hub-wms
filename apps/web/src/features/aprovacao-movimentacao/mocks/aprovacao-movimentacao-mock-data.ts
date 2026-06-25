import type {
  MovimentacaoItem,
  MovimentacaoSummary,
} from '@/features/aprovacao-movimentacao/types/aprovacao-movimentacao.schema';

export const MOCK_MOVIMENTACAO_SUMMARY: MovimentacaoSummary = {
  totalPendente: 1240,
  totalPendenteUnidade: 'PLT',
  impactoOperacional: 14.5,
  impactoOperacionalUnidade: 'Horas de Empilhadeira',
  alertasCriticos: 8,
  alertasCriticosLabel: 'FEFO Atrasados',
};

const BASE_ITEMS: MovimentacaoItem[] = [
  {
    id: 'mov-88291',
    codigo: '#MOV-88291',
    produto: 'Monitor Gamer 27" 144hz',
    sku: 'SKU-9902-LG',
    lote: 'L2024-X',
    origem: 'P-04-12-B',
    destino: 'DOCA-02',
    motivoRegra: 'Ruptura Iminente',
    prioridade: 'URGENTE',
    tipo: 'Ressuprimento',
    dataSolicitacao: '2026-06-05',
  },
  {
    id: 'mov-88295',
    codigo: '#MOV-88295',
    produto: 'Cabo HDMI Premium 2m',
    sku: 'SKU-4412-CB',
    lote: 'L2024-A',
    origem: 'Q-01-05-A',
    destino: 'PICK-08',
    motivoRegra: 'Quarentena Automática',
    prioridade: 'ALTA',
    tipo: 'Quarentena',
    dataSolicitacao: '2026-06-05',
  },
  {
    id: 'mov-88301',
    codigo: '#MOV-88301',
    produto: 'Processador Core i7 13th Gen',
    sku: 'SKU-7721-IN',
    lote: 'L2023-M',
    origem: 'P-12-01-D',
    destino: 'PICK-12',
    motivoRegra: 'Slotting Inteligente',
    prioridade: 'MEDIA',
    tipo: 'Slotting',
    dataSolicitacao: '2026-06-04',
  },
];

const PRODUTOS = [
  'Teclado Mecânico RGB',
  'Mouse Sem Fio Pro',
  'SSD NVMe 1TB',
  'Memória RAM 16GB DDR5',
  'Webcam Full HD',
  'Headset Gamer 7.1',
  'Hub USB-C 7 Portas',
  'Fonte ATX 750W',
  'Placa de Vídeo RTX 4060',
  'Monitor 24" IPS',
  'Notebook Stand Ergonômico',
  'Switch Gigabit 8 Portas',
  'Roteador Wi-Fi 6',
  'Impressora Térmica',
  'Leitor de Código de Barras',
  'Etiquetadora Industrial',
  'Empilhadeira Paleteira',
  'Caixa Plástica 60L',
  'Palete PBR Recondicionado',
  'Stretch Film 500mm',
  'Fita Adesiva Reforçada',
];

const ORIGENS = [
  'P-01-02-A',
  'P-02-08-C',
  'P-05-11-B',
  'Q-02-03-D',
  'Q-03-07-A',
  'P-08-04-E',
  'P-10-06-F',
  'Q-04-01-B',
];

const DESTINOS = [
  'DOCA-01',
  'DOCA-03',
  'PICK-04',
  'PICK-06',
  'PICK-10',
  'PICK-15',
  'STAGE-02',
  'EXPED-01',
];

const MOTIVOS = [
  'Ruptura Iminente',
  'Quarentena Automática',
  'Slotting Inteligente',
  'Inventário Cíclico',
  'FEFO Atrasado',
  'Consolidação de Lote',
  'Realocação de Zona',
];

const PRIORIDADES = ['URGENTE', 'ALTA', 'MEDIA', 'BAIXA'] as const;
const TIPOS = [
  'Ressuprimento',
  'Quarentena',
  'Slotting',
  'Inventario',
] as const;

function gerarItensExtras(count: number): MovimentacaoItem[] {
  return Array.from({ length: count }, (_, index) => {
    const seq = 88310 + index;
    const produto = PRODUTOS[index % PRODUTOS.length]!;
    const prioridade = PRIORIDADES[index % PRIORIDADES.length]!;
    const tipo = TIPOS[index % TIPOS.length]!;

    return {
      id: `mov-${seq}`,
      codigo: `#MOV-${seq}`,
      produto,
      sku: `SKU-${7000 + index}-${String.fromCharCode(65 + (index % 26))}${String.fromCharCode(66 + (index % 25))}`,
      lote: `L2024-${String.fromCharCode(65 + (index % 26))}`,
      origem: ORIGENS[index % ORIGENS.length]!,
      destino: DESTINOS[index % DESTINOS.length]!,
      motivoRegra: MOTIVOS[index % MOTIVOS.length]!,
      prioridade,
      tipo,
      dataSolicitacao:
        index % 3 === 0
          ? '2026-06-05'
          : index % 3 === 1
            ? '2026-06-04'
            : '2026-06-03',
    };
  });
}

export const MOCK_MOVIMENTACOES: MovimentacaoItem[] = [
  ...BASE_ITEMS,
  ...gerarItensExtras(21),
];
