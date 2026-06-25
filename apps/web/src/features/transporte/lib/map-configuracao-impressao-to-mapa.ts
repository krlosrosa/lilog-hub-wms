import type { ConfiguracaoImpressaoApi } from '@/features/expedicao-impressao-config/types/configuracao-impressao.api';
import type { TipoQuebra } from '@/features/expedicao-impressao-config/types/impressao-config.schema';
import type {
  ConfigMapaImpressao,
  PreConfiguracaoMapa,
  TipoQuebraPalete,
} from '@/features/transporte/types/transporte.schema';
import { DEFAULT_CONFIG_MAPA_IMPRESSAO } from '@/features/transporte/types/transporte.schema';

function mapTipoQuebra(tipo: TipoQuebra): TipoQuebraPalete {
  if (tipo === 'porcentual') {
    return 'percentual';
  }

  return 'linhas';
}

function mapConfiguracaoToMapa(
  configuracao: ConfiguracaoImpressaoApi['configuracao'],
): ConfigMapaImpressao {
  const { quebraPalete, opcoesSeparacao } = configuracao;

  return {
    tipoDadosBasicos: configuracao.tipoDadosBasicos,
    quebraPalete: {
      ativo: quebraPalete.ativa,
      tipo: mapTipoQuebra(quebraPalete.tipo),
      valor: quebraPalete.percentual,
    },
    segregarPaleteFull: opcoesSeparacao.separarPaletesCompletos,
    segregarUnidade: opcoesSeparacao.separarUnidadesIndividuais,
    segregarFifo: opcoesSeparacao.segregarFifo,
    faixasFifo: opcoesSeparacao.faixasFifo,
    exibirClienteCabecalho:
      configuracao.tipoDadosBasicos === 'cliente'
        ? true
        : DEFAULT_CONFIG_MAPA_IMPRESSAO.exibirClienteCabecalho,
    agrupamento: { ...DEFAULT_CONFIG_MAPA_IMPRESSAO.agrupamento },
    opcoesConferencia: { ...configuracao.opcoesConferencia },
  };
}

export function mapConfiguracaoImpressaoToPreConfiguracao(
  item: ConfiguracaoImpressaoApi,
): PreConfiguracaoMapa {
  return {
    id: item.id,
    nome: item.nome,
    descricao: item.isPadrao ? 'Configuração padrão' : undefined,
    config: mapConfiguracaoToMapa(item.configuracao),
  };
}
