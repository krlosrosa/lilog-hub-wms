import type { RegrasWmsStats } from '@/features/regras-wms/types/regra-wms.schema';
import type { RegraWmsV2 } from '@/features/regras-wms/types/regra-wms-tree.schema';

export const MOCK_REGRAS_WMS: RegraWmsV2[] = [
  {
    id: 'rw-001',
    nome: 'Quarentena por validade curta',
    descricao:
      'Produtos com validade inferior a 30 dias são enviados automaticamente para quarentena.',
    ativo: true,
    prioridade: 90,
    gatilho: 'recebimento',
    arvoreCondicoes: {
      operador: 'all',
      filhos: [
        {
          tipo: 'condicao',
          id: 'c-001',
          campo: 'dias_validade',
          operador: 'menor_que',
          valor: '30',
        },
        {
          tipo: 'condicao',
          id: 'c-002',
          campo: 'situacao_produto',
          operador: 'igual',
          valor: 'integro',
        },
      ],
    },
    acao: {
      tipo: 'quarentena',
      parametros: {
        zonaDestino: 'Quarentena',
        motivo: 'Validade inferior a 30 dias',
      },
    },
    criadoEm: '2025-11-10T08:00:00Z',
    atualizadoEm: '2026-01-15T14:30:00Z',
  },
  {
    id: 'rw-002',
    nome: 'Reposição automática picking',
    descricao:
      'Aciona reposição quando o estoque em endereço de picking fica abaixo do nível mínimo.',
    ativo: true,
    prioridade: 70,
    gatilho: 'movimentacao',
    arvoreCondicoes: {
      operador: 'all',
      filhos: [
        {
          tipo: 'condicao',
          id: 'c-003',
          campo: 'quantidade_estoque',
          operador: 'menor_que',
          valor: '10',
        },
        {
          tipo: 'condicao',
          id: 'c-004',
          campo: 'tipo_endereco',
          operador: 'igual',
          valor: 'picking',
        },
      ],
    },
    acao: {
      tipo: 'acionar_reposicao',
      parametros: {
        mensagem: 'Estoque abaixo do nível mínimo em picking',
      },
    },
    criadoEm: '2025-10-05T10:00:00Z',
    atualizadoEm: '2026-02-01T09:15:00Z',
  },
  {
    id: 'rw-003',
    nome: 'Bloqueio laticínios ou perecíveis vencendo',
    descricao:
      'Bloqueia laticínios com mais de 5 dias OU produtos com validade inferior a 15 dias.',
    ativo: true,
    prioridade: 85,
    gatilho: 'movimentacao',
    arvoreCondicoes: {
      operador: 'any',
      filhos: [
        {
          tipo: 'grupo',
          id: 'g-001',
          operador: 'all',
          filhos: [
            {
              tipo: 'condicao',
              id: 'c-005',
              campo: 'categoria_produto',
              operador: 'igual',
              valor: 'laticinios',
            },
            {
              tipo: 'condicao',
              id: 'c-006',
              campo: 'dias_producao',
              operador: 'maior_que',
              valor: '5',
            },
          ],
        },
        {
          tipo: 'grupo',
          id: 'g-002',
          operador: 'all',
          filhos: [
            {
              tipo: 'condicao',
              id: 'c-006b',
              campo: 'dias_validade',
              operador: 'menor_que',
              valor: '15',
            },
            {
              tipo: 'condicao',
              id: 'c-006c',
              campo: 'situacao_produto',
              operador: 'igual',
              valor: 'integro',
            },
          ],
        },
      ],
    },
    acao: {
      tipo: 'bloquear_movimentacao',
      parametros: {
        motivo: 'Produto perecível fora do prazo',
      },
    },
    criadoEm: '2025-09-20T11:00:00Z',
    atualizadoEm: '2025-12-18T16:45:00Z',
  },
  {
    id: 'rw-004',
    nome: 'Alerta avaria em zona congelada',
    descricao:
      'Gera alerta de alta prioridade quando produto avariado é detectado em zona congelada.',
    ativo: true,
    prioridade: 95,
    gatilho: 'inventario',
    arvoreCondicoes: {
      operador: 'all',
      filhos: [
        {
          tipo: 'condicao',
          id: 'c-007',
          campo: 'zona_temperatura',
          operador: 'igual',
          valor: 'congelado',
        },
        {
          tipo: 'condicao',
          id: 'c-008',
          campo: 'situacao_produto',
          operador: 'igual',
          valor: 'avariado',
        },
      ],
    },
    acao: {
      tipo: 'gerar_alerta',
      parametros: {
        mensagem: 'Produto avariado detectado em zona congelada',
        prioridade: 'alta',
      },
    },
    criadoEm: '2025-08-12T07:30:00Z',
    atualizadoEm: '2026-03-01T10:00:00Z',
  },
  {
    id: 'rw-005',
    nome: 'Etiqueta especial importados',
    descricao:
      'Produtos importados com peso acima de 50 kg recebem etiqueta especial de manuseio.',
    ativo: true,
    prioridade: 40,
    gatilho: 'recebimento',
    arvoreCondicoes: {
      operador: 'all',
      filhos: [
        {
          tipo: 'condicao',
          id: 'c-009',
          campo: 'fornecedor',
          operador: 'contem',
          valor: 'importado',
        },
        {
          tipo: 'condicao',
          id: 'c-010',
          campo: 'peso',
          operador: 'maior_que',
          valor: '50',
        },
      ],
    },
    acao: {
      tipo: 'etiqueta_especial',
      parametros: {
        mensagem: 'Manuseio especial — produto importado pesado',
      },
    },
    criadoEm: '2025-07-01T09:00:00Z',
    atualizadoEm: '2025-11-22T13:20:00Z',
  },
  {
    id: 'rw-006',
    nome: 'Mover bebidas para depósito B',
    descricao:
      'Bebidas recebidas com volume entre 0.5 e 2 m³ são direcionadas ao Depósito B.',
    ativo: false,
    prioridade: 30,
    gatilho: 'recebimento',
    arvoreCondicoes: {
      operador: 'all',
      filhos: [
        {
          tipo: 'condicao',
          id: 'c-011',
          campo: 'categoria_produto',
          operador: 'igual',
          valor: 'bebidas',
        },
        {
          tipo: 'condicao',
          id: 'c-012',
          campo: 'volume',
          operador: 'entre',
          valor: '0.5',
          valorFim: '2',
        },
      ],
    },
    acao: {
      tipo: 'mover_deposito',
      parametros: {
        zonaDestino: 'Depósito B',
        motivo: 'Roteamento padrão bebidas',
      },
    },
    criadoEm: '2025-06-15T14:00:00Z',
    atualizadoEm: '2026-01-08T08:00:00Z',
  },
];

export const MOCK_REGRAS_WMS_STATS: RegrasWmsStats = {
  total: MOCK_REGRAS_WMS.length,
  ativas: MOCK_REGRAS_WMS.filter((r) => r.ativo).length,
  inativas: MOCK_REGRAS_WMS.filter((r) => !r.ativo).length,
  conflitosPotenciais: 2,
};
