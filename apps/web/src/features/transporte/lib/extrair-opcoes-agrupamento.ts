import type { TransporteGrupo } from '@/features/transporte/types/transporte.schema';

export type OpcaoItemAgrupamento = {
  id: string;
  label: string;
  grupo?: string;
};

export type OpcoesAgrupamentoMapa = {
  clientes: OpcaoItemAgrupamento[];
  transportes: OpcaoItemAgrupamento[];
  remessas: OpcaoItemAgrupamento[];
};

export function extrairOpcoesAgrupamento(
  transportes: TransporteGrupo[],
): OpcoesAgrupamentoMapa {
  const clientesSet = new Set<string>();
  const transportesOpcoes: OpcaoItemAgrupamento[] = [];
  const remessasOpcoes: OpcaoItemAgrupamento[] = [];

  transportes.forEach((transporte) => {
    transportesOpcoes.push({
      id: transporte.id,
      label: transporte.rota,
      grupo: `${transporte.cidade} · ${transporte.bairro}`,
    });

    transporte.remessas.forEach((remessa) => {
      clientesSet.add(remessa.cliente);
      remessasOpcoes.push({
        id: remessa.id,
        label: remessa.remessa,
        grupo: remessa.cliente,
      });
    });
  });

  const clientes = [...clientesSet]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((cliente) => ({ id: cliente, label: cliente }));

  return {
    clientes,
    transportes: transportesOpcoes,
    remessas: remessasOpcoes,
  };
}
