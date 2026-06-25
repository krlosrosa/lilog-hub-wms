import type {
  Etiqueta,
  PickingItem,
  ResumoPicking,
  Tarefa,
} from '../types/peso-variavel.schema';

export const TAREFAS: Tarefa[] = [
  {
    id: 'pk-94210',
    pedidoId: '#PK-94210',
    zona: 'A-NORTH (Cold)',
    totalSkus: 3,
    status: 'pendente',
    prioridade: 'alto_valor',
    descricao: 'Peso Variável: Queijo Prato, Mussarela e Coalho',
    tituloJornada: 'Expedição Zona A-Norte',
  },
  {
    id: 'pk-94215',
    pedidoId: '#PK-94215',
    zona: 'B-CENTRAL',
    totalSkus: 24,
    status: 'pendente',
    prioridade: 'padrao',
    descricao: 'Peso Variável: Queijo Minas Frescal e Ricota',
    tituloJornada: 'Expedição Zona B-Central',
  },
  {
    id: 'pk-93902',
    pedidoId: '#PK-93902',
    zona: 'A-NORTH (Cold)',
    totalSkus: 3,
    status: 'express',
    prioridade: 'despacho_imediato',
    descricao: 'Peso Variável: Queijo Mussarela',
    tituloJornada: 'Expedição Zona A-Norte',
  },
  {
    id: 'pk-94218',
    pedidoId: '#PK-94218',
    zona: 'Zona C',
    totalSkus: 12,
    pesoTotalKg: 45,
    status: 'pendente',
    prioridade: 'padrao',
    descricao: 'Peso Variável: Queijo Parmesão',
    tituloJornada: 'Expedição Zona C',
  },
  {
    id: 'pk-94100',
    pedidoId: '#PK-94100',
    zona: 'A-NORTH (Cold)',
    totalSkus: 10,
    status: 'em_andamento',
    prioridade: 'padrao',
    descricao: 'Peso Variável: Queijo Prato e Provolone',
    tituloJornada: 'Expedição Zona A-Norte',
  },
];

export const PICKING_ITEMS_BY_TAREFA: Record<string, PickingItem[]> = {
  'pk-94210': [
    {
      id: 'item-1',
      sku: 'SKU-8829-PRM',
      nome: 'Queijo Prato',
      lote: 'LOT-2023-B4',
      unidade: 'Caixa',
      quantidadeRestante: 1,
    },
    {
      id: 'item-2',
      sku: 'SKU-4401-SLM',
      nome: 'Queijo Mussarela',
      lote: 'LOT-2024-A1',
      unidade: 'Caixa',
      quantidadeRestante: 1,
    },
    {
      id: 'item-3',
      sku: 'SKU-1102-BEF',
      nome: 'Queijo Coalho',
      lote: 'LOT-2023-C2',
      unidade: 'Caixa',
      quantidadeRestante: 1,
    },
  ],
  'pk-94215': [
    {
      id: 'item-1',
      sku: 'SKU-7701-VEG',
      nome: 'Queijo Minas Frescal',
      lote: 'LOT-2024-V1',
      unidade: 'Caixa',
      quantidadeRestante: 12,
    },
    {
      id: 'item-2',
      sku: 'SKU-7702-RTB',
      nome: 'Queijo Ricota',
      lote: 'LOT-2024-V2',
      unidade: 'Caixa',
      quantidadeRestante: 10,
    },
  ],
  'pk-93902': [
    {
      id: 'item-1',
      sku: 'SKU-4401-SLM',
      nome: 'Queijo Mussarela',
      lote: 'LOT-2024-A1',
      unidade: 'Caixa',
      quantidadeRestante: 3,
    },
  ],
  'pk-94218': [
    {
      id: 'item-1',
      sku: 'SKU-9901-DRY',
      nome: 'Queijo Parmesão',
      lote: 'LOT-2023-D1',
      unidade: 'Saco',
      quantidadeRestante: 6,
    },
  ],
  'pk-94100': [
    {
      id: 'item-1',
      sku: 'SKU-8829-PRM',
      nome: 'Queijo Prato',
      lote: 'LOT-2023-B4',
      unidade: 'Caixa',
      quantidadeRestante: 8,
    },
    {
      id: 'item-2',
      sku: 'SKU-8820-PRM',
      nome: 'Queijo Provolone',
      lote: 'LOT-2023-B5',
      unidade: 'Caixa',
      quantidadeRestante: 2,
    },
  ],
};

function buildEtiquetasForTarefa(tarefaId: string, items: PickingItem[]): Etiqueta[] {
  const etiquetas: Etiqueta[] = [];
  let seq = 1;

  for (const item of items) {
    for (let i = 0; i < item.quantidadeRestante; i++) {
      const padded = String(seq).padStart(3, '0');
      etiquetas.push({
        id: `etq-${tarefaId}-${padded}`,
        codigo: `ETQ-${tarefaId.replace('pk-', '')}-${padded}`,
        sku: item.sku,
        nome: item.nome,
        lote: item.lote,
        unidade: item.unidade,
      });
      seq += 1;
    }
  }

  return etiquetas;
}

export const ETIQUETAS_BY_TAREFA: Record<string, Etiqueta[]> = Object.fromEntries(
  Object.entries(PICKING_ITEMS_BY_TAREFA).map(([tarefaId, items]) => [
    tarefaId,
    buildEtiquetasForTarefa(tarefaId, items),
  ]),
);

const DEFAULT_PICKING_ITEMS: PickingItem[] = PICKING_ITEMS_BY_TAREFA['pk-94210'] ?? [];

export function getTarefaById(id: string): Tarefa | undefined {
  return TAREFAS.find((t) => t.id === id);
}

export function getPickingItemsByTarefaId(id: string): PickingItem[] {
  return PICKING_ITEMS_BY_TAREFA[id] ?? DEFAULT_PICKING_ITEMS;
}

export function getEtiquetasByTarefaId(id: string): Etiqueta[] {
  return (
    ETIQUETAS_BY_TAREFA[id] ??
    buildEtiquetasForTarefa(id, getPickingItemsByTarefaId(id))
  );
}

export function getEtiquetaByCodigo(
  tarefaId: string,
  codigo: string,
): Etiqueta | undefined {
  const normalized = codigo.trim().toUpperCase();
  return getEtiquetasByTarefaId(tarefaId).find(
    (e) => e.codigo.toUpperCase() === normalized,
  );
}

export const MOCK_RESUMO_BY_TAREFA: Record<string, ResumoPicking> = {
  'pk-94210': {
    tarefaId: 'pk-94210',
    loteId: '#B-99234-X',
    zona: 'Zona A-Norte',
    totalCaixas: 3,
    pesoTotalKg: 1420.5,
    divergencias: 0,
    operador: 'Operador 042',
    turno: 'Dia',
    skus: [
      {
        id: 'sku-1',
        sku: 'SKU-8829-PRM',
        descricao: 'Queijo Prato',
        separado: 1,
        esperado: 1,
        status: 'correspondido',
      },
      {
        id: 'sku-2',
        sku: 'SKU-4401-SLM',
        descricao: 'Queijo Mussarela',
        separado: 1,
        esperado: 1,
        status: 'correspondido',
      },
      {
        id: 'sku-3',
        sku: 'SKU-1102-BEF',
        descricao: 'Queijo Coalho',
        separado: 1,
        esperado: 1,
        status: 'correspondido',
      },
    ],
  },
};

export function getResumoByTarefaId(id: string): ResumoPicking {
  const tarefa = getTarefaById(id);
  const existing = MOCK_RESUMO_BY_TAREFA[id];
  if (existing) return existing;

  const items = getPickingItemsByTarefaId(id);
  return {
    tarefaId: id,
    loteId: `#B-${id.toUpperCase()}`,
    zona: tarefa?.zona ?? 'Zona A-Norte',
    totalCaixas: items.reduce((acc, i) => acc + i.quantidadeRestante, 0),
    pesoTotalKg: tarefa?.pesoTotalKg ?? 1420.5,
    divergencias: 0,
    operador: 'Operador 042',
    turno: 'Dia',
    skus: items.map((item, index) => ({
      id: `sku-${index}`,
      sku: item.sku,
      descricao: item.nome,
      separado: item.quantidadeRestante,
      esperado: item.quantidadeRestante,
      status: 'correspondido' as const,
    })),
  };
}

export const TAB_LABELS: Record<'pendentes' | 'em_andamento', string> = {
  pendentes: 'Pendentes',
  em_andamento: 'Em Andamento',
};
