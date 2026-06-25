import type { PreConfiguracaoMapa } from '@/features/transporte/types/transporte.schema';
import { DEFAULT_CONFIG_MAPA_IMPRESSAO } from '@/features/transporte/types/transporte.schema';

export const MOCK_PRE_CONFIGURACOES_MAPA: PreConfiguracaoMapa[] = [
  {
    id: 'padrao-expedicao',
    nome: 'Padrão expedição',
    descricao: 'Um mapa por transporte, sem quebras adicionais',
    config: {
      ...DEFAULT_CONFIG_MAPA_IMPRESSAO,
    },
  },
  {
    id: 'quebra-linhas-full',
    nome: 'Quebra por linhas + palete full',
    descricao: 'Quebra a cada 15 linhas e segrega paletes completos',
    config: {
      tipoDadosBasicos: 'transporte',
      quebraPalete: { ativo: true, tipo: 'linhas', valor: 15 },
      segregarPaleteFull: true,
      segregarUnidade: false,
      segregarFifo: false,
      faixasFifo: [],
      exibirClienteCabecalho: true,
      agrupamento: {
        tiposAtivos: [],
        clientesSegregados: [],
        grupos: [],
      },
      opcoesConferencia: { ...DEFAULT_CONFIG_MAPA_IMPRESSAO.opcoesConferencia },
    },
  },
  {
    id: 'fifo-refrigerado',
    nome: 'FIFO refrigerado',
    descricao: 'Segrega faixas amarelo e vermelho por transporte',
    config: {
      tipoDadosBasicos: 'transporte',
      quebraPalete: { ativo: false, tipo: 'linhas', valor: 10 },
      segregarPaleteFull: false,
      segregarUnidade: false,
      segregarFifo: true,
      faixasFifo: ['amarelo', 'vermelho'],
      exibirClienteCabecalho: true,
      agrupamento: {
        tiposAtivos: [],
        clientesSegregados: [],
        grupos: [],
      },
      opcoesConferencia: { ...DEFAULT_CONFIG_MAPA_IMPRESSAO.opcoesConferencia },
    },
  },
  {
    id: 'por-cliente',
    nome: 'Segregar por cliente',
    descricao: 'Mapas individuais por cliente com quebra percentual',
    config: {
      tipoDadosBasicos: 'cliente',
      quebraPalete: { ativo: true, tipo: 'percentual', valor: 25 },
      segregarPaleteFull: false,
      segregarUnidade: false,
      segregarFifo: false,
      faixasFifo: [],
      exibirClienteCabecalho: true,
      agrupamento: {
        tiposAtivos: ['segregar_clientes'],
        clientesSegregados: [],
        grupos: [],
      },
      opcoesConferencia: { ...DEFAULT_CONFIG_MAPA_IMPRESSAO.opcoesConferencia },
    },
  },
  {
    id: 'consolidado-remessas',
    nome: 'Grupos personalizados + FIFO',
    descricao: 'FIFO completo com grupos definidos pelo usuário',
    config: {
      tipoDadosBasicos: 'transporte',
      quebraPalete: { ativo: false, tipo: 'linhas', valor: 10 },
      segregarPaleteFull: true,
      segregarUnidade: false,
      segregarFifo: true,
      faixasFifo: ['amarelo', 'laranja', 'vermelho'],
      exibirClienteCabecalho: false,
      agrupamento: {
        tiposAtivos: ['grupos_customizados'],
        clientesSegregados: [],
        grupos: [],
      },
      opcoesConferencia: { ...DEFAULT_CONFIG_MAPA_IMPRESSAO.opcoesConferencia },
    },
  },
];
