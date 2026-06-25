import type {
  ConfigImpressaoMapaSeparacao,
  ItemSeparacao,
  TipoDestinoAlocacao,
} from '@/features/transporte/types/impressao-mapa-separacao.schema';
import type { TransporteGrupo } from '@/features/transporte/types/transporte.schema';

const PREFIXO_DESTINO: Record<TipoDestinoAlocacao, string> = {
  doca: 'DOCA',
  staging: 'STAGING',
  zona_expedicao: 'EXP-ZONA',
  pulmao_expedicao: 'PULMÃO-EXP',
  endereco_temporario: 'TMP',
};

export function resolverDestinoBloco(
  config: ConfigImpressaoMapaSeparacao,
  transporte: TransporteGrupo,
  agrupador: string,
): string {
  const { tipo, referencia } = config.destinoAlocacao;
  const prefixo = PREFIXO_DESTINO[tipo];
  const ref = referencia.trim() || transporte.regiao;

  switch (tipo) {
    case 'doca':
      return `${prefixo} ${ref}`;
    case 'staging':
      return `${prefixo}-${ref}`;
    case 'zona_expedicao':
      return `${prefixo} ${ref} / ${agrupador}`;
    case 'pulmao_expedicao':
      return `${prefixo}-${ref}`;
    case 'endereco_temporario':
      return `${prefixo}-${ref}-${agrupador}`;
    default:
      return ref;
  }
}

export function resolverDestinoItem(
  config: ConfigImpressaoMapaSeparacao,
  transporte: TransporteGrupo,
  item: ItemSeparacao,
  destinoBloco: string,
): string {
  if (item.paleteFechado) {
    const pulmao = config.destinoAlocacao.referencia.trim() || 'EXP-01';
    return `PULMÃO-EXP-${pulmao} / Palete NF ${item.numeroNF}`;
  }

  if (config.destinoAlocacao.tipo === 'doca') {
    return `${destinoBloco} / NF ${item.numeroNF}`;
  }

  return `${destinoBloco} / ${item.rotaEntrega}`;
}

export function gerarQrValidacaoMapa(
  transporteId: string,
  blocoId: string,
  tipoSeparacao: string,
): string {
  return `MAPA-SEP|${transporteId}|${blocoId}|${tipoSeparacao}`;
}

export function gerarQrValidacaoDemanda(
  demandaId: string,
  transporteId: string,
): string {
  return `DEM-EMP|${transporteId}|${demandaId}`;
}
