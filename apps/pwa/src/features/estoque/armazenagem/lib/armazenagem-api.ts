import type {

  ConfirmarItemArmazenagemPayload,

  PoliticaArmazenagem,

} from '@lilog/contracts';



import { request } from '@/lib/offline/api-client';



export type ItemArmazenagemApi = {

  id: string;

  demandaId: string;

  tarefaId: string | null;

  produtoId: string;

  unitizadorId: string | null;

  unitizadorCodigo: string | null;

  quantidade: number;

  unidadeMedida: string;

  lote: string | null;

  validade: string | null;

  numeroSerie: string | null;

  enderecoSugeridoId: string | null;

  enderecoSugeridoLabel: string | null;

  enderecoConfirmadoId: string | null;

  status: 'pendente' | 'em_andamento' | 'armazenado' | 'divergente';

  produtoSku: string | null;

  produtoNome: string | null;

};



export type TarefaArmazenagemApi = {

  id: string;

  demandaId: string;

  unitizadorId: string | null;

  unitizadorCodigo: string | null;

  sequencia: number;

  status: 'pendente' | 'em_andamento' | 'armazenada' | 'divergente' | 'cancelada';

  enderecoSugeridoId: string | null;

  enderecoConfirmadoId: string | null;

  enderecoSugeridoLabel: string | null;

  responsavelId: number | null;

  startedAt: string | null;

  finishedAt: string | null;

  itens: ItemArmazenagemApi[];

  createdAt: string;

  updatedAt: string;

};



export type DemandaArmazenagemDetalheApi = {

  id: string;

  unidadeId: string;

  recebimentoId: string;

  modoUnitizacao: string;

  status: 'aguardando_validacao' | 'aguardando_inicio' | 'em_andamento' | 'concluida' | 'cancelada';

  responsavelId: number | null;

  startedAt: string | null;

  finishedAt: string | null;

  itens: ItemArmazenagemApi[];

  tarefas?: TarefaArmazenagemApi[];

  politica: PoliticaArmazenagem;

};



export type DemandaArmazenagemListItemApi = Omit<

  DemandaArmazenagemDetalheApi,

  'itens' | 'tarefas' | 'politica'

>;



export type ListDemandasApi = {

  items: DemandaArmazenagemListItemApi[];

  total: number;

  page: number;

  limit: number;

};



export async function fetchDemandasArmazenagem(

  unidadeId: string,

): Promise<ListDemandasApi> {

  const params = new URLSearchParams({ unidadeId });

  return request<ListDemandasApi>(`/armazenagem/demandas?${params.toString()}`);

}



export async function fetchDemandaArmazenagem(

  demandaId: string,

): Promise<DemandaArmazenagemDetalheApi> {

  return request<DemandaArmazenagemDetalheApi>(

    `/armazenagem/demandas/${encodeURIComponent(demandaId)}`,

  );

}



export type BuscarTarefaPorEtiquetaApi = {
  demandaId: string;
  tarefaId: string;
  unitizadorCodigo: string;
};

export async function buscarTarefaArmazenagemPorEtiqueta(
  unidadeId: string,
  codigo: string,
): Promise<BuscarTarefaPorEtiquetaApi> {
  const params = new URLSearchParams({
    unidadeId,
    codigo: codigo.trim(),
  });

  return request<BuscarTarefaPorEtiquetaApi>(
    `/armazenagem/tarefas/por-etiqueta?${params.toString()}`,
  );
}



export async function iniciarDemandaArmazenagem(

  demandaId: string,

): Promise<DemandaArmazenagemDetalheApi> {

  return request<DemandaArmazenagemDetalheApi>(

    `/armazenagem/demandas/${encodeURIComponent(demandaId)}/iniciar`,

    { method: 'POST' },

  );

}



export async function iniciarTarefaArmazenagem(

  demandaId: string,

  tarefaId: string,

): Promise<TarefaArmazenagemApi> {

  return request<TarefaArmazenagemApi>(

    `/armazenagem/demandas/${encodeURIComponent(demandaId)}/tarefas/${encodeURIComponent(tarefaId)}/iniciar`,

    { method: 'POST' },

  );

}



export async function confirmarItemArmazenagem(

  demandaId: string,

  itemId: string,

  payload: ConfirmarItemArmazenagemPayload,

): Promise<ItemArmazenagemApi> {

  return request<ItemArmazenagemApi>(

    `/armazenagem/demandas/${encodeURIComponent(demandaId)}/itens/${encodeURIComponent(itemId)}/confirmar`,

    {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify(payload),

    },

  );

}



export type ConfirmarTarefaArmazenagemPayload = {

  enderecoConfirmadoId: string;

  unitizadorCodigo?: string;

  motivoDivergencia?: string;

};



export async function confirmarTarefaArmazenagem(

  demandaId: string,

  tarefaId: string,

  payload: ConfirmarTarefaArmazenagemPayload,

): Promise<TarefaArmazenagemApi> {

  return request<TarefaArmazenagemApi>(

    `/armazenagem/demandas/${encodeURIComponent(demandaId)}/tarefas/${encodeURIComponent(tarefaId)}/confirmar`,

    {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify(payload),

    },

  );

}



export async function concluirDemandaArmazenagem(

  demandaId: string,

): Promise<DemandaArmazenagemDetalheApi> {

  return request<DemandaArmazenagemDetalheApi>(

    `/armazenagem/demandas/${encodeURIComponent(demandaId)}/concluir`,

    { method: 'POST' },

  );

}



type EnderecoDisponivelApi = {

  id: string;

  enderecoMascarado: string;

};



export async function resolveEnderecoPorLabel(

  demandaId: string,

  itemOrTarefaId: string,

  label: string,

  mode: 'item' | 'tarefa' = 'item',

): Promise<string | null> {

  const params = new URLSearchParams({ search: label.trim(), limit: '5' });

  const basePath =

    mode === 'tarefa'

      ? `/armazenagem/demandas/${encodeURIComponent(demandaId)}/tarefas/${encodeURIComponent(itemOrTarefaId)}/enderecos-disponiveis`

      : `/armazenagem/demandas/${encodeURIComponent(demandaId)}/itens/${encodeURIComponent(itemOrTarefaId)}/enderecos-disponiveis`;



  const result = await request<{ items: EnderecoDisponivelApi[] }>(

    `${basePath}?${params.toString()}`,

  );

  const normalized = label.trim().toUpperCase();

  const match =

    result.items.find(

      (item) => item.enderecoMascarado.trim().toUpperCase() === normalized,

    ) ?? result.items[0];

  return match?.id ?? null;

}



export async function findTarefaByUnitizadorCodigo(

  demanda: DemandaArmazenagemDetalheApi,

  codigo: string,

): Promise<TarefaArmazenagemApi | null> {

  const normalized = codigo.trim().toUpperCase();

  return (

    demanda.tarefas?.find(

      (tarefa) => tarefa.unitizadorCodigo?.trim().toUpperCase() === normalized,

    ) ?? null

  );

}


