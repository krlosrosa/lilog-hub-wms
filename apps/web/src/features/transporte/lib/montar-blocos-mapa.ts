import type {
  BlocoMapaImpressao,
  ConfigMapaImpressao,
  GrupoMapaCustomizado,
  LinhaMapaImpressao,
  RemessaLinhaItem,
  TransporteGrupo,
} from '@/features/transporte/types/transporte.schema';

type ItemComContexto = {
  item: RemessaLinhaItem;
  transporte: TransporteGrupo;
};

function coletarItens(transportes: TransporteGrupo[]): ItemComContexto[] {
  const resultado: ItemComContexto[] = [];

  transportes.forEach((transporte) => {
    transporte.remessas.forEach((remessa) => {
      (remessa.itens ?? []).forEach((item) => {
        resultado.push({ item, transporte });
      });
    });
  });

  return resultado;
}

function criarLinha({ item, transporte }: ItemComContexto): LinhaMapaImpressao {
  return {
    item,
    transporteId: transporte.id,
    transporteRota: transporte.rota,
  };
}

function montarLinhasTransporte(transporte: TransporteGrupo): LinhaMapaImpressao[] {
  return coletarItens([transporte]).map((contexto) => criarLinha(contexto));
}

function montarBlocosPorCliente(transportes: TransporteGrupo[]): BlocoMapaImpressao[] {
  const porCliente = new Map<
    string,
    { cliente: string; linhas: LinhaMapaImpressao[] }
  >();

  coletarItens(transportes).forEach((contexto) => {
    const codCliente = contexto.item.codCliente;
    const atual = porCliente.get(codCliente) ?? {
      cliente: contexto.item.cliente,
      linhas: [],
    };

    atual.linhas.push(criarLinha(contexto));
    porCliente.set(codCliente, atual);
  });

  return Array.from(porCliente.entries()).map(([codCliente, { cliente, linhas }]) => ({
    id: `cliente-${codCliente}`,
    titulo: cliente,
    subtitulo: `Cód. ${codCliente}`,
    cliente,
    linhas,
  }));
}

function montarBlocosPorTransporte(
  transportes: TransporteGrupo[],
  config: ConfigMapaImpressao,
): BlocoMapaImpressao[] {
  return transportes.map((transporte) => ({
    id: transporte.id,
    titulo: transporte.rota,
    subtitulo: `${transporte.cidade} · ${transporte.bairro}`,
    cliente: config.exibirClienteCabecalho ? undefined : transporte.cidade,
    transporte,
    linhas: montarLinhasTransporte(transporte),
  }));
}

function deveAplicarSegregacaoClientes(config: ConfigMapaImpressao): boolean {
  return (
    config.agrupamento.tiposAtivos.includes('segregar_clientes') &&
    config.agrupamento.clientesSegregados.length > 0
  );
}

function aplicarSegregacaoEmBlocos(
  blocos: BlocoMapaImpressao[],
  config: ConfigMapaImpressao,
): BlocoMapaImpressao[] {
  if (!deveAplicarSegregacaoClientes(config)) {
    return blocos;
  }

  const clientesAlvo = new Set(config.agrupamento.clientesSegregados);
  const resultado: BlocoMapaImpressao[] = [];

  blocos.forEach((bloco) => {
    const linhasRestantes: LinhaMapaImpressao[] = [];
    const linhasPorClienteSegregado = new Map<
      string,
      { cliente: string; linhas: LinhaMapaImpressao[] }
    >();

    bloco.linhas.forEach((linha) => {
      const codCliente = linha.item.codCliente;

      if (clientesAlvo.has(codCliente)) {
        const atual = linhasPorClienteSegregado.get(codCliente) ?? {
          cliente: linha.item.cliente,
          linhas: [],
        };

        atual.linhas.push(linha);
        linhasPorClienteSegregado.set(codCliente, atual);
        return;
      }

      linhasRestantes.push(linha);
    });

    linhasPorClienteSegregado.forEach(({ cliente, linhas }, codCliente) => {
      resultado.push({
        id: `${bloco.id}-cliente-${codCliente}`,
        titulo: bloco.titulo,
        subtitulo: `${cliente} · Cód. ${codCliente}`,
        cliente,
        transporte: bloco.transporte,
        linhas,
      });
    });

    if (linhasRestantes.length > 0) {
      resultado.push({
        ...bloco,
        linhas: linhasRestantes,
      });
    }
  });

  return resultado;
}

function itemPertenceAoGrupoCustomizado(
  contexto: ItemComContexto,
  tipoItem: GrupoMapaCustomizado['tipoItem'],
  itemValor: string,
): boolean {
  const valor = itemValor.trim();
  if (!valor) {
    return false;
  }

  switch (tipoItem) {
    case 'transporte':
      return (
        contexto.transporte.rota === valor || contexto.transporte.id === valor
      );
    case 'cliente':
      return (
        contexto.item.codCliente === valor || contexto.item.cliente === valor
      );
    case 'remessa':
      return (
        contexto.item.numeroRemessa === valor ||
        contexto.item.remessaId === valor
      );
  }
}

function montarSubtituloGrupoCustomizado(
  tipoItem: GrupoMapaCustomizado['tipoItem'],
  linhas: LinhaMapaImpressao[],
): string {
  switch (tipoItem) {
    case 'transporte': {
      const rotas = [...new Set(linhas.map((linha) => linha.transporteRota))];
      return rotas.join(' · ');
    }
    case 'cliente': {
      const clientes = [
        ...new Set(
          linhas.map((linha) => `${linha.item.cliente} · Cód. ${linha.item.codCliente}`),
        ),
      ];
      return clientes.join(' · ');
    }
    case 'remessa': {
      const remessas = [...new Set(linhas.map((linha) => linha.item.numeroRemessa))];
      return remessas.join(' · ');
    }
  }
}

function montarBlocosPorGruposCustomizados(
  transportes: TransporteGrupo[],
  grupos: GrupoMapaCustomizado[],
): BlocoMapaImpressao[] {
  return grupos.flatMap((grupo) => {
    if (!grupo.nome.trim() || !grupo.itens.length) {
      return [];
    }

    const nomeGrupo = grupo.nome.trim();
    const linhas = coletarItens(transportes)
      .filter((contexto) =>
        grupo.itens.some((itemValor) =>
          itemPertenceAoGrupoCustomizado(contexto, grupo.tipoItem, itemValor),
        ),
      )
      .map((contexto) => criarLinha(contexto));

    if (!linhas.length) {
      return [];
    }

    return [
      {
        id: grupo.id,
        titulo: nomeGrupo,
        subtitulo: montarSubtituloGrupoCustomizado(grupo.tipoItem, linhas),
        linhas,
      },
    ];
  });
}

function coletarIdsLinhasDosBlocos(blocos: BlocoMapaImpressao[]): Set<string> {
  const ids = new Set<string>();

  blocos.forEach((bloco) => {
    bloco.linhas.forEach((linha) => {
      ids.add(linha.item.id);
    });
  });

  return ids;
}

function filtrarTransportesExcluindoLinhas(
  transportes: TransporteGrupo[],
  linhasExcluidas: Set<string>,
): TransporteGrupo[] {
  return transportes
    .map((transporte) => ({
      ...transporte,
      remessas: transporte.remessas
        .map((remessa) => ({
          ...remessa,
          itens: (remessa.itens ?? []).filter((item) => !linhasExcluidas.has(item.id)),
        }))
        .filter((remessa) => (remessa.itens?.length ?? 0) > 0),
    }))
    .filter((transporte) => transporte.remessas.length > 0);
}

function montarBlocosComGruposCustomizados(
  transportes: TransporteGrupo[],
  config: ConfigMapaImpressao,
): BlocoMapaImpressao[] {
  const blocosGrupos = montarBlocosPorGruposCustomizados(
    transportes,
    config.agrupamento.grupos,
  );

  if (!blocosGrupos.length) {
    return montarBlocosPorTransporte(transportes, config);
  }

  const linhasConsumidas = coletarIdsLinhasDosBlocos(blocosGrupos);
  const transportesRestantes = filtrarTransportesExcluindoLinhas(
    transportes,
    linhasConsumidas,
  );
  const blocosRestantes = montarBlocosPorTransporte(transportesRestantes, config);

  return [...blocosGrupos, ...blocosRestantes];
}

const CATEGORIA_LABELS: Record<string, string> = {
  seco: 'Seco',
  refrigerado: 'Refrigerado',
  queijo: 'Queijo',
  sem_categoria: 'Sem categoria',
};

function labelCategoria(categoria: string): string {
  return CATEGORIA_LABELS[categoria] ?? categoria;
}

function chaveEmpresaCategoria(linha: LinhaMapaImpressao): string {
  const empresa = linha.item.empresa ?? 'SEM_EMPRESA';
  const categoria = linha.item.categoria ?? 'sem_categoria';
  return `${empresa}::${categoria}`;
}

function montarSubtituloEmpresaCategoria(
  subtitulo: string | undefined,
  empresa: string,
  categoria: string,
): string {
  const sufixo = `${empresa} · ${labelCategoria(categoria)}`;
  return subtitulo?.trim() ? `${subtitulo} · ${sufixo}` : sufixo;
}

function aplicarAgrupamentoEmpresaCategoria(
  blocos: BlocoMapaImpressao[],
): BlocoMapaImpressao[] {
  const resultado: BlocoMapaImpressao[] = [];

  blocos.forEach((bloco) => {
    const porEmpresaCategoria = new Map<string, LinhaMapaImpressao[]>();

    bloco.linhas.forEach((linha) => {
      const chave = chaveEmpresaCategoria(linha);
      const atual = porEmpresaCategoria.get(chave) ?? [];
      atual.push(linha);
      porEmpresaCategoria.set(chave, atual);
    });

    porEmpresaCategoria.forEach((linhas, chave) => {
      const separador = chave.indexOf('::');
      const empresa = chave.slice(0, separador);
      const categoria = chave.slice(separador + 2);

      resultado.push({
        ...bloco,
        id:
          porEmpresaCategoria.size > 1
            ? `${bloco.id}-${empresa}-${categoria}`
            : bloco.id,
        empresa,
        categoria,
        subtitulo: montarSubtituloEmpresaCategoria(
          bloco.subtitulo,
          empresa,
          categoria,
        ),
        linhas,
      });
    });
  });

  return resultado;
}

function resolverBlocosBase(
  transportes: TransporteGrupo[],
  config: ConfigMapaImpressao,
): BlocoMapaImpressao[] {
  let blocos: BlocoMapaImpressao[];

  if (config.tipoDadosBasicos === 'cliente') {
    blocos = montarBlocosPorCliente(transportes);
  } else if (config.agrupamento.tiposAtivos.includes('grupos_customizados')) {
    blocos = montarBlocosComGruposCustomizados(transportes, config);
  } else {
    blocos = montarBlocosPorTransporte(transportes, config);
  }

  return aplicarAgrupamentoEmpresaCategoria(
    aplicarSegregacaoEmBlocos(blocos, config),
  );
}

export function montarBlocosMapa(
  transportes: TransporteGrupo[],
  config: ConfigMapaImpressao,
): BlocoMapaImpressao[] {
  return resolverBlocosBase(transportes, config).filter(
    (bloco) => bloco.linhas.length > 0,
  );
}
