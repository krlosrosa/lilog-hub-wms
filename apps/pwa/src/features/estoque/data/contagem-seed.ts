import type { InventoryAddress, InventoryDemand } from '../types/estoque.schema';

function buildContagemEnderecos(
  prefix: string,
  corredor: string,
  total: number,
  conferidos: number
): InventoryAddress[] {
  return Array.from({ length: total }, (_, index) => {
    const sequence = index + 1;
    let status: InventoryAddress['status'] = 'pendente';
    if (index < conferidos) status = 'conferido';
    else if (index === conferidos) status = 'em_andamento';

    return {
      id: `${prefix}-${corredor}-${sequence}`,
      endereco: `${prefix}-${corredor}-${String(sequence).padStart(2, '0')}`,
      status,
      sequence,
    };
  });
}

export const SEED_CONTAGEM_ENDERECOS: Record<string, InventoryAddress[]> = {
  'INV-2024-001': buildContagemEnderecos('PA', '14', 48, 12),
  'INV-2024-005': buildContagemEnderecos('CR', '01', 22, 3),
  'INV-2024-002': buildContagemEnderecos('BS', '02', 18, 7),
  'INV-2024-012': buildContagemEnderecos('PB', '22', 12, 2),
};

export const SEED_INVENTORY_DEMANDS: InventoryDemand[] = [
  {
    id: '#INV-2024-001',
    type: 'cega',
    zone: 'Picking A',
    aisle: 'Corredor 14',
    routeId: 'INV-2024-001',
    assignedUserAvatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBZD1-q-hf9COxeBF9wfZrAvjrU2ZKtz5ekexDGGTpp3kkCWWzoqt51oo1rDBqXJVzGfUDaQuOH-O1b0Qqg08fIRLgOE6ZwcdiZGb-Wj2a4HLv7vmvqoLfKLMb2d49M5hNf--l6GhjkodOdW6UvUg7RbVLwlyy2hLeAy31aDAvTdLk4k4CCWJdYObL-hQ7lXZ2KUrFWvNljteddMcjbSHbCtY7uM79ZHpCK3E8bcxf5vVReMvLjpzjzqk_YRn6HM8Ut9ps4NJUYi2RR',
  },
  {
    id: '#INV-2024-002',
    type: 'validacao',
    zone: 'Bulk Storage',
    aisle: 'Corredor 02',
    routeId: 'INV-2024-002',
    isPriority: true,
  },
  {
    id: '#INV-2024-005',
    type: 'cega',
    zone: 'Cold Room',
    aisle: 'Frez-01',
    routeId: 'INV-2024-005',
    timeAgo: '2h atrás',
  },
  {
    id: '#INV-2024-012',
    type: 'validacao',
    zone: 'Picking B',
    aisle: 'Corredor 22',
    routeId: 'INV-2024-012',
    tag: 'Retrabalho',
  },
];
