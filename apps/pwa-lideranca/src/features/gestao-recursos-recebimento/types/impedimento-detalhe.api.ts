export type ImpedimentoDetalheApi = {
  id: string;
  tipo: string;
  descricao: string;
  photoCount: number;
  registradoPorId: number | null;
  registradoPorNome: string | null;
  registradoPorMatricula: string | null;
  registradoEm: string;
};

export type PreRecebimentoImpedimentoDetalheApi = {
  preRecebimento: {
    id: string;
    placa: string | null;
    transportadoraNome: string | null;
    situacao: string;
  };
  impedimento: ImpedimentoDetalheApi | null;
};

export type DocumentoApi = {
  id: string;
  nome: string;
  chave: string;
  mimeType: string;
  tamanho: number;
  entidadeTipo: string | null;
  entidadeId: string | null;
  status: string;
  uploadedBy: number | null;
  createdAt: string;
};

export type ImpedimentoFotoDetalhe = {
  id: string;
  legenda: string;
  url: string;
};

export type ImpedimentoDetalheViewModel = {
  preRecebimentoId: string;
  placa: string | null;
  transportadoraNome: string | null;
  tipo: string;
  tipoLabel: string;
  descricao: string;
  photoCount: number;
  registradoPorNome: string | null;
  registradoPorMatricula: string | null;
  registradoEm: string;
  fotos: ImpedimentoFotoDetalhe[];
};
