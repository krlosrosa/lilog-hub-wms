import type {
  ConfigOtimizacaoRota,
  LinhaMapaPicking,
} from '@/features/transporte/types/geracao-mapas-separacao.schema';

function parseEndereco(endereco: string): {
  rua: string;
  corredor: number;
  modulo: number;
  nivel: number;
} {
  const [rua = 'A', corredor = '01', modulo = '01', nivel = '01'] =
    endereco.split('-');
  return {
    rua,
    corredor: Number(corredor) || 0,
    modulo: Number(modulo) || 0,
    nivel: Number(nivel) || 0,
  };
}

export function otimizarRotaColeta(
  linhas: LinhaMapaPicking[],
  config: ConfigOtimizacaoRota,
): LinhaMapaPicking[] {
  if (!config.ativo) {
    return linhas.map((linha, index) => ({
      ...linha,
      sequenciaColeta: index + 1,
    }));
  }

  const ordenadas = [...linhas].sort((a, b) => {
    const ea = parseEndereco(a.endereco);
    const eb = parseEndereco(b.endereco);

    if (config.ordenarPorRua && ea.rua !== eb.rua) {
      return ea.rua.localeCompare(eb.rua);
    }
    if (config.ordenarPorCorredor && ea.corredor !== eb.corredor) {
      return ea.corredor - eb.corredor;
    }
    if (config.ordenarPorModulo && ea.modulo !== eb.modulo) {
      return ea.modulo - eb.modulo;
    }
    if (config.ordenarPorNivel && ea.nivel !== eb.nivel) {
      if (config.priorizarNivelChao) {
        return ea.nivel - eb.nivel;
      }
      return eb.nivel - ea.nivel;
    }

    return a.endereco.localeCompare(b.endereco);
  });

  return ordenadas.map((linha, index) => ({
    ...linha,
    sequenciaColeta: index + 1,
  }));
}

export function estimarDistancia(linhas: LinhaMapaPicking[]): number {
  if (linhas.length <= 1) return linhas.length * 15;

  const enderecosUnicos = new Set(linhas.map((l) => l.endereco));
  const base = enderecosUnicos.size * 18;
  const corredores = new Set(linhas.map((l) => l.corredor)).size;
  return Math.round(base + corredores * 12);
}

export function estimarTempoMinutos(
  linhas: LinhaMapaPicking[],
  distancia: number,
): number {
  const tempoLinhas = linhas.length * 0.8;
  const tempoDeslocamento = distancia / 60;
  return Math.max(5, Math.round(tempoLinhas + tempoDeslocamento));
}
