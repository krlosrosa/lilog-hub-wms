export type CentroOrigemApi = {
  centro: string;
  nome: string;
};

export type ListCentrosOrigemApiResponse = {
  items: CentroOrigemApi[];
  total: number;
  page: number;
  limit: number;
};

export type CreateCentroOrigemPayload = {
  centro: string;
  nome: string;
};

export type UpdateCentroOrigemPayload = {
  nome?: string;
};
