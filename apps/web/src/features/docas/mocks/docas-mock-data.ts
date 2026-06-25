import type { DocaListaItem, TurnoUtilizacao } from '@/features/docas/types/docas.schema';

/** @deprecated Mantido apenas para referência visual — não usado em produção */
export const MOCK_DOCAS: DocaListaItem[] = [
  {
    id: 'mock-1',
    unidadeId: 'U001',
    codigo: 'D01',
    nome: 'Doca 01',
    tipo: 'recebimento',
    situacao: 'disponivel',
    capacidadeVeiculos: 2,
    observacao: null,
  },
  {
    id: 'mock-2',
    unidadeId: 'U001',
    codigo: 'D02',
    nome: 'Doca 02',
    tipo: 'expedicao',
    situacao: 'ocupada',
    capacidadeVeiculos: 1,
    observacao: null,
  },
];

export const MOCK_TURNOS_UTILIZACAO: TurnoUtilizacao[] = [
  { turno: 1, percentual: 45 },
  { turno: 2, percentual: 72 },
  { turno: 3, percentual: 38 },
];
