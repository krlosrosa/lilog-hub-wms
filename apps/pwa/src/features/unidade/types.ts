export type UnidadeOption = {
  id: string;
  nome: string;
  nomeFilial: string;
  cluster: string;
};

export type ListMyUnidadesResponse = {
  items: UnidadeOption[];
};
