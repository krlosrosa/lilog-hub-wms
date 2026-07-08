export type DemandaArmazenagemStatusApi =
  | 'aguardando_validacao'
  | 'aguardando_inicio'
  | 'em_andamento'
  | 'concluida'
  | 'cancelada';

export type ItemArmazenagemStatusApi =
  | 'pendente'
  | 'em_andamento'
  | 'armazenado'
  | 'divergente';

export type ModoUnitizacaoApi =
  | 'bipar_palete_no_recebimento'
  | 'gerar_etiqueta_na_armazenagem';

export type ItemArmazenagemApi = {
  id: string;
  demandaId: string;
  tarefaId?: string | null;
  unitizadorId: string | null;
  unitizadorCodigo?: string | null;
  produtoId: string;
  quantidade: number;
  unidadeMedida: string;
  lote: string | null;
  validade: string | null;
  numeroSerie: string | null;
  enderecoSugeridoId: string | null;
  enderecoConfirmadoId: string | null;
  status: ItemArmazenagemStatusApi;
  produtoSku?: string | null;
  produtoNome?: string | null;
  enderecoSugeridoLabel?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TarefaArmazenagemApi = {
  id: string;
  demandaId: string;
  unitizadorId: string | null;
  unitizadorCodigo: string | null;
  sequencia: number;
  status: ItemArmazenagemStatusApi | 'armazenada' | 'cancelada';
  enderecoSugeridoId: string | null;
  enderecoConfirmadoId: string | null;
  enderecoSugeridoLabel: string | null;
  itens: ItemArmazenagemApi[];
  createdAt: string;
  updatedAt: string;
};

export type DemandaArmazenagemApi = {
  id: string;
  unidadeId: string;
  recebimentoId: string;
  modoUnitizacao: ModoUnitizacaoApi | string;
  status: DemandaArmazenagemStatusApi;
  responsavelId: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  validadoPor: number | null;
  validadoEm: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DemandaArmazenagemDetailApi = DemandaArmazenagemApi & {
  itens: ItemArmazenagemApi[];
  tarefas?: TarefaArmazenagemApi[];
};

export type ListDemandasArmazenagemApiResponse = {
  items: DemandaArmazenagemApi[];
  total: number;
  page: number;
  limit: number;
};

export type ItemArmazenagemView = ItemArmazenagemApi & {
  produtoSku?: string;
  produtoNome?: string;
  unitizadorCodigo?: string | null;
  enderecoSugeridoLabel?: string;
  enderecoConfirmadoLabel?: string;
};

export type DemandaArmazenagemDetailView = Omit<
  DemandaArmazenagemDetailApi,
  'itens'
> & {
  itens: ItemArmazenagemView[];
};

export const DEMANDA_ARMAZENAGEM_STATUS_LABELS: Record<
  DemandaArmazenagemStatusApi,
  string
> = {
  aguardando_validacao: 'Aguardando validação',
  aguardando_inicio: 'Aguardando início',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export const ITEM_ARMAZENAGEM_STATUS_LABELS: Record<
  ItemArmazenagemStatusApi,
  string
> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  armazenado: 'Armazenado',
  divergente: 'Divergente',
};

export const MODO_UNITIZACAO_LABELS: Record<ModoUnitizacaoApi, string> = {
  bipar_palete_no_recebimento: 'Bipar palete no recebimento',
  gerar_etiqueta_na_armazenagem: 'Gerar etiqueta na armazenagem',
};
