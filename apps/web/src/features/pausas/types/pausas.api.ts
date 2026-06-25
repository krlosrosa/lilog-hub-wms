export type SessaoPausaTipoApi = 'termica' | 'refeicao' | 'outros';

export type SessaoFuncionarioPausaApi = {
  id: string;
  sessaoFuncionarioId: string;
  tipo: SessaoPausaTipoApi;
  inicio: string;
  fim: string | null;
  registradoPorUserId: number | null;
  observacao: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListSessaoFuncionarioPausasApiResponse = {
  items: SessaoFuncionarioPausaApi[];
  totalPausasMinutos: number;
  emPausaAgora: SessaoFuncionarioPausaApi | null;
};

export type IniciarSessaoPausaPayload = {
  tipo: SessaoPausaTipoApi;
  observacao?: string;
};
