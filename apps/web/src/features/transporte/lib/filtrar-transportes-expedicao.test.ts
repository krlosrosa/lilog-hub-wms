import { describe, expect, it } from 'vitest';

import {
  contarTransportesPorFiltroRapido,
  filtrarTransportesExpedicao,
  transporteTemMapaSalvo,
  transporteTemPlacaAlocada,
} from '@/features/transporte/lib/filtrar-transportes-expedicao';
import type { TransporteGrupo } from '@/features/transporte/types/transporte.schema';

function criarTransporte(
  overrides: Partial<TransporteGrupo> = {},
): TransporteGrupo {
  return {
    id: 't1',
    rota: '100',
    regiao: 'Sul',
    cidade: 'Curitiba',
    bairro: 'Centro',
    remessas: [],
    quantidadeRemessas: 1,
    pesoTotal: 100,
    volumeTotal: 1,
    distanciaKm: 10,
    itinerario: null,
    perfilEsperado: 'Toco',
    status: 'PENDENTE',
    dataTransporte: '2026-06-26',
    ...overrides,
  };
}

describe('filtrar-transportes-expedicao', () => {
  it('identifica placa alocada e mapa salvo', () => {
    const semPlaca = criarTransporte();
    const alocado = criarTransporte({
      id: 't2',
      status: 'ALOCADO',
      veiculoAlocado: {
        veiculoId: 'v1',
        placa: 'ABC1D23',
        tipo: 'Toco',
        motorista: '',
        transportadora: 'Transp A',
      },
    });
    const comMapa = criarTransporte({
      id: 't3',
      ultimoMapaLoteId: 'lote-1',
    });

    expect(transporteTemPlacaAlocada(semPlaca)).toBe(false);
    expect(transporteTemPlacaAlocada(alocado)).toBe(true);
    expect(transporteTemMapaSalvo(comMapa)).toBe(true);
    expect(transporteTemMapaSalvo(semPlaca)).toBe(false);
  });

  it('filtra e conta por filtro rápido', () => {
    const transportes = [
      criarTransporte({ id: 't1' }),
      criarTransporte({
        id: 't2',
        status: 'ALOCADO',
        veiculoAlocado: {
          veiculoId: 'v1',
          placa: 'ABC1D23',
          tipo: 'Toco',
          motorista: '',
          transportadora: 'Transp A',
        },
      }),
      criarTransporte({ id: 't3', ultimoMapaLoteId: 'lote-1' }),
    ];

    expect(filtrarTransportesExpedicao(transportes, 'sem_placa')).toHaveLength(2);
    expect(filtrarTransportesExpedicao(transportes, 'alocados')).toHaveLength(1);
    expect(filtrarTransportesExpedicao(transportes, 'com_mapa')).toHaveLength(1);
    expect(filtrarTransportesExpedicao(transportes, 'sem_mapa')).toHaveLength(2);

    expect(contarTransportesPorFiltroRapido(transportes)).toEqual({
      todos: 3,
      sem_placa: 2,
      alocados: 1,
      sem_mapa: 2,
      com_mapa: 1,
    });
  });
});
