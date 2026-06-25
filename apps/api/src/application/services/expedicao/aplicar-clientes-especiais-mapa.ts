import type { GerarMapasConfigInput } from '../../dtos/expedicao/gerar-mapas.dto.js';
import {
  codigosClienteEquivalentes,
  normalizarCodCliente,
} from '../../../domain/model/expedicao/cliente-especial.model.js';
import type { ClienteEspecialRecord } from '../../../domain/repositories/expedicao/cliente-especial.repository.js';
import type { BlocoMapaInterno } from './montar-grupos-mapa.js';

const MARCADOR_CLIENTE_ESPECIAL = '⚠ CLIENTE ESPECIAL';

export { codigosClienteEquivalentes, normalizarCodCliente };

export function resolverCodigosRemessaParaClienteEspecial(
  cliente: ClienteEspecialRecord,
  codClientesRemessa: string[],
): string[] {
  return codClientesRemessa.filter((codRemessa) =>
    codigosClienteEquivalentes(cliente.codCliente, codRemessa),
  );
}

export function montarMapaClientesEspeciaisPorCodigoRemessa(
  clientesEspeciais: ClienteEspecialRecord[],
  codClientesRemessa: string[],
): Map<string, ClienteEspecialRecord> {
  const mapa = new Map<string, ClienteEspecialRecord>();

  codClientesRemessa.forEach((codRemessa) => {
    const cliente = clientesEspeciais.find((item) =>
      codigosClienteEquivalentes(item.codCliente, codRemessa),
    );

    if (cliente) {
      mapa.set(codRemessa, cliente);
    }
  });

  return mapa;
}

export function aplicarClientesEspeciaisNaConfig(
  config: GerarMapasConfigInput,
  clientesEspeciais: ClienteEspecialRecord[],
  codClientesRemessa: string[] = [],
): GerarMapasConfigInput {
  const clientesComSegregacao = clientesEspeciais.filter(
    (cliente) => cliente.exigeSegregacaoMapa,
  );

  if (!clientesComSegregacao.length) {
    return config;
  }

  const codigosSegregacaoRemessa = [
    ...new Set(
      clientesComSegregacao.flatMap((cliente) =>
        resolverCodigosRemessaParaClienteEspecial(cliente, codClientesRemessa),
      ),
    ),
  ];

  const codigosSegregacao =
    codigosSegregacaoRemessa.length > 0
      ? codigosSegregacaoRemessa
      : clientesComSegregacao.map((cliente) => cliente.codCliente);

  const clientesSegregados = [
    ...new Set([...config.agrupamento.clientesSegregados, ...codigosSegregacao]),
  ];

  const tiposAtivos: GerarMapasConfigInput['agrupamento']['tiposAtivos'] =
    config.agrupamento.tiposAtivos.includes('segregar_clientes')
      ? config.agrupamento.tiposAtivos
      : [...config.agrupamento.tiposAtivos, 'segregar_clientes'];

  return {
    ...config,
    agrupamento: {
      ...config.agrupamento,
      tiposAtivos,
      clientesSegregados,
    },
  };
}

function montarLinhaObservacaoCliente(cliente: ClienteEspecialRecord): string {
  const partes: string[] = [];

  if (cliente.observacaoGeral?.trim()) {
    partes.push(cliente.observacaoGeral.trim());
  }

  if (cliente.observacaoSeparacao?.trim()) {
    partes.push(`Sep: ${cliente.observacaoSeparacao.trim()}`);
  }

  if (cliente.observacaoCarregamento?.trim()) {
    partes.push(`Carr: ${cliente.observacaoCarregamento.trim()}`);
  }

  return `${cliente.codCliente} — ${cliente.nomeCliente}: ${partes.join(' | ') || 'Cliente especial'}`;
}

export function coletarClientesEspeciaisDoBloco(
  bloco: BlocoMapaInterno,
  clientesEspeciaisPorCodigo: Map<string, ClienteEspecialRecord>,
): ClienteEspecialRecord[] {
  const clientes: ClienteEspecialRecord[] = [];
  const vistos = new Set<string>();

  bloco.linhas.forEach((linha) => {
    const codRemessa = linha.item.codCliente;
    const direto = clientesEspeciaisPorCodigo.get(codRemessa);

    if (direto) {
      const chave = normalizarCodCliente(direto.codCliente);
      if (!vistos.has(chave)) {
        vistos.add(chave);
        clientes.push(direto);
      }
      return;
    }

    for (const cliente of clientesEspeciaisPorCodigo.values()) {
      if (!codigosClienteEquivalentes(cliente.codCliente, codRemessa)) {
        continue;
      }

      const chave = normalizarCodCliente(cliente.codCliente);
      if (vistos.has(chave)) {
        return;
      }

      vistos.add(chave);
      clientes.push(cliente);
      return;
    }
  });

  return clientes;
}

export function montarContextoClienteEspecialDoBloco(
  bloco: BlocoMapaInterno,
  clientesEspeciaisPorCodigo: Map<string, ClienteEspecialRecord>,
): {
  subtitulo?: string;
  infoAdicionaisI?: string;
  infoAdicionaisII?: string;
} {
  const clientes = coletarClientesEspeciaisDoBloco(
    bloco,
    clientesEspeciaisPorCodigo,
  );

  if (!clientes.length) {
    return {};
  }

  const linhasObservacao = clientes.map(montarLinhaObservacaoCliente);
  const subtituloBase = bloco.subtitulo?.trim();
  const subtitulo = subtituloBase
    ? `${subtituloBase} · ${MARCADOR_CLIENTE_ESPECIAL}`
    : MARCADOR_CLIENTE_ESPECIAL;

  return {
    subtitulo,
    infoAdicionaisI: linhasObservacao[0] ?? MARCADOR_CLIENTE_ESPECIAL,
    infoAdicionaisII: linhasObservacao.slice(1).join(' · ') || undefined,
  };
}

export function clienteEstaNaListaSegregacao(
  codCliente: string,
  clientesSegregados: string[],
): boolean {
  return clientesSegregados.some((codigoAlvo) =>
    codigosClienteEquivalentes(codigoAlvo, codCliente),
  );
}
