export type EquipeApi = {
  id: string;
  unidadeId: string;
  nome: string;
  area: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ListEquipesApiResponse = {
  items: EquipeApi[];
  total: number;
  page: number;
  limit: number;
};

export type FuncionarioEquipeApiResponse = {
  equipeId: string | null;
};
