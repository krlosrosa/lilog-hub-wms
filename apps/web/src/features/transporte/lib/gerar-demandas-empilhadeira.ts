import {
  gerarQrValidacaoDemanda,
  resolverDestinoBloco,
} from '@/features/transporte/lib/resolver-destino-alocacao';
import type {
  BlocoMapaSeparacao,
  ConfigImpressaoMapaSeparacao,
  DemandaEmpilhadeira,
} from '@/features/transporte/types/impressao-mapa-separacao.schema';
import type { TransporteGrupo } from '@/features/transporte/types/transporte.schema';

const ORIGEM_SEPARACAO = 'STG-SEP';

export function gerarDemandasEmpilhadeira(
  blocos: BlocoMapaSeparacao[],
  config: ConfigImpressaoMapaSeparacao,
  transporte: TransporteGrupo,
): DemandaEmpilhadeira[] {
  if (!config.destinoAlocacao.gerarDemandaEmpilhadeira) {
    return [];
  }

  const demandas: DemandaEmpilhadeira[] = [];

  blocos.forEach((bloco) => {
    const itensPalete = bloco.itens.filter((item) => item.paleteFechado);
    if (!itensPalete.length) {
      return;
    }

    const porRemessa = new Map<string, typeof itensPalete>();
    itensPalete.forEach((item) => {
      const atual = porRemessa.get(item.remessaId) ?? [];
      atual.push(item);
      porRemessa.set(item.remessaId, atual);
    });

    porRemessa.forEach((linhas, remessaId) => {
      const primeira = linhas[0];
      if (!primeira) {
        return;
      }

      const numeroNF = primeira.numeroNF;
      const destino =
        primeira.enderecoAlocacao ??
        resolverDestinoBloco(config, transporte, bloco.agrupador);
      const id = `dem-emp-${bloco.id}-${remessaId}`;

      demandas.push({
        id,
        blocoId: bloco.id,
        numeroNF,
        origem: `${ORIGEM_SEPARACAO} / ${bloco.titulo}`,
        destino,
        peso: linhas.reduce((acc, l) => acc + l.peso, 0),
        volume: linhas.reduce((acc, l) => acc + l.volume, 0),
        status: 'pendente',
        qrCodeValor: gerarQrValidacaoDemanda(id, transporte.id),
        motivo: 'Palete fechado detectado na separação',
      });
    });
  });

  return demandas;
}
