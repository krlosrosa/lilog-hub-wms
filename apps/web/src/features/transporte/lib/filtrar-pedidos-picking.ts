import type {
  FiltrosPedidoPicking,
  PedidoPicking,
  ResumoSelecaoPedidos,
} from '@/features/transporte/types/geracao-mapas-separacao.schema';

export function filtrarPedidosPicking(
  pedidos: PedidoPicking[],
  filtros: FiltrosPedidoPicking,
): PedidoPicking[] {
  const busca = filtros.busca.trim().toLowerCase();

  return pedidos.filter((pedido) => {
    if (busca) {
      const match =
        pedido.numeroNF.toLowerCase().includes(busca) ||
        pedido.cliente.toLowerCase().includes(busca) ||
        pedido.rota.toLowerCase().includes(busca) ||
        pedido.transportadora.toLowerCase().includes(busca) ||
        pedido.id.toLowerCase().includes(busca);
      if (!match) return false;
    }

    if (filtros.rota !== 'todos' && pedido.rota !== filtros.rota) return false;
    if (
      filtros.transportadora !== 'todos' &&
      pedido.transportadora !== filtros.transportadora
    ) {
      return false;
    }
    if (filtros.cliente !== 'todos' && pedido.cliente !== filtros.cliente) {
      return false;
    }
    if (
      filtros.prioridade !== 'todos' &&
      pedido.prioridade !== filtros.prioridade
    ) {
      return false;
    }
    if (
      filtros.tipoPedido !== 'todos' &&
      pedido.tipoPedido !== filtros.tipoPedido
    ) {
      return false;
    }
    if (
      filtros.centroDistribuicao !== 'todos' &&
      pedido.centroDistribuicao !== filtros.centroDistribuicao
    ) {
      return false;
    }
    if (
      filtros.dataExpedicao &&
      pedido.dataExpedicao !== filtros.dataExpedicao
    ) {
      return false;
    }

    return true;
  });
}

export function calcularResumoSelecao(
  pedidos: PedidoPicking[],
  selecionados: Set<string>,
): ResumoSelecaoPedidos {
  const selecionadosList = pedidos.filter((p) => selecionados.has(p.id));

  return {
    qtdPedidos: selecionadosList.length,
    qtdLinhas: selecionadosList.reduce((acc, p) => acc + p.qtdLinhas, 0),
    qtdVolumes: selecionadosList.reduce((acc, p) => acc + p.qtdVolumes, 0),
    pesoTotal: selecionadosList.reduce((acc, p) => acc + p.peso, 0),
    volumeTotal: selecionadosList.reduce((acc, p) => acc + p.volume, 0),
  };
}
