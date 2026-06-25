import { z } from 'zod';

export const docaSituacaoSchema = z.enum([
  'disponivel',
  'ocupada',
  'reservada',
  'bloqueada',
  'manutencao',
]);

export type DocaSituacao = z.infer<typeof docaSituacaoSchema>;

export const docaTipoSchema = z.enum([
  'recebimento',
  'expedicao',
  'compartilhada',
]);

export type DocaTipo = z.infer<typeof docaTipoSchema>;

export const filtroDocaSituacaoSchema = z.enum([
  'todos',
  'disponivel',
  'ocupada',
  'reservada',
  'bloqueada',
  'manutencao',
]);

export type FiltroDocaSituacao = z.infer<typeof filtroDocaSituacaoSchema>;

export const filtroDocaTipoSchema = z.enum([
  'todos',
  'recebimento',
  'expedicao',
  'compartilhada',
]);

export type FiltroDocaTipo = z.infer<typeof filtroDocaTipoSchema>;

export type DocaListaItem = {
  id: string;
  unidadeId: string;
  codigo: string;
  nome: string;
  tipo: DocaTipo;
  situacao: DocaSituacao;
  capacidadeVeiculos: number | null;
  observacao: string | null;
};

export type DocaStats = {
  total: number;
  disponivel: number;
  ocupada: number;
  reservada: number;
  bloqueada: number;
  manutencao: number;
};

export type TurnoUtilizacao = {
  turno: number;
  percentual: number;
};

export const DOCA_SITUACAO_LABELS: Record<DocaSituacao, string> = {
  disponivel: 'Disponível',
  ocupada: 'Ocupada',
  reservada: 'Reservada',
  bloqueada: 'Bloqueada',
  manutencao: 'Manutenção',
};

export const DOCA_TIPO_LABELS: Record<DocaTipo, string> = {
  recebimento: 'Recebimento',
  expedicao: 'Expedição',
  compartilhada: 'Compartilhada',
};

export const FILTRO_DOCA_SITUACAO_LABELS: Record<FiltroDocaSituacao, string> = {
  todos: 'Todos',
  disponivel: 'Disponível',
  ocupada: 'Ocupada',
  reservada: 'Reservada',
  bloqueada: 'Bloqueada',
  manutencao: 'Manutenção',
};

export const FILTRO_DOCA_TIPO_LABELS: Record<FiltroDocaTipo, string> = {
  todos: 'Todos os tipos',
  recebimento: 'Recebimento',
  expedicao: 'Expedição',
  compartilhada: 'Compartilhada',
};

export const FILTROS_DOCA_SITUACAO: readonly FiltroDocaSituacao[] = [
  'todos',
  'disponivel',
  'ocupada',
  'reservada',
  'bloqueada',
  'manutencao',
] as const;

export const FILTROS_DOCA_TIPO: readonly FiltroDocaTipo[] = [
  'todos',
  'recebimento',
  'expedicao',
  'compartilhada',
] as const;
