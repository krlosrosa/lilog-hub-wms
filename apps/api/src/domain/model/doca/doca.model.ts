import { z } from 'zod';

export const DocaTipoSchema = z.enum([
  'recebimento',
  'expedicao',
  'compartilhada',
]);

export type DocaTipo = z.infer<typeof DocaTipoSchema>;

export const DocaSituacaoSchema = z.enum([
  'disponivel',
  'ocupada',
  'reservada',
  'bloqueada',
  'manutencao',
]);

export type DocaSituacao = z.infer<typeof DocaSituacaoSchema>;

export const OperacaoDocaTipoSchema = z.enum([
  'recebimento',
  'expedicao',
  'transferencia',
  'cross_docking',
  'devolucao',
]);

export type OperacaoDocaTipo = z.infer<typeof OperacaoDocaTipoSchema>;

export const OperacaoDocaSituacaoSchema = z.enum([
  'agendada',
  'aguardando_veiculo',
  'em_execucao',
  'finalizada',
  'cancelada',
]);

export type OperacaoDocaSituacao = z.infer<typeof OperacaoDocaSituacaoSchema>;

export const OperacaoDocaPrioridadeSchema = z.enum([
  'urgente',
  'prioritaria',
  'normal',
  'baixa',
]);

export type OperacaoDocaPrioridade = z.infer<
  typeof OperacaoDocaPrioridadeSchema
>;

export const DocaSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string().min(1).max(50),
  codigo: z.string().min(1).max(50),
  nome: z.string().min(1).max(255),
  tipo: DocaTipoSchema,
  situacao: DocaSituacaoSchema,
  capacidadeVeiculos: z.number().int().positive().nullable(),
  observacao: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Doca = z.infer<typeof DocaSchema>;

export const CreateDocaInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  codigo: z.string().min(1).max(50),
  nome: z.string().min(1).max(255),
  tipo: DocaTipoSchema,
  capacidadeVeiculos: z.number().int().positive().optional(),
  observacao: z.string().optional(),
});

export type CreateDocaInput = z.infer<typeof CreateDocaInputSchema>;

export const BulkCreateDocaInputSchema = z
  .object({
    unidadeId: z.string().min(1).max(50),
    numeroInicial: z.number().int().positive(),
    numeroFinal: z.number().int().positive(),
    codigoPrefixo: z.string().min(1).max(20).default('D'),
    nomePrefixo: z.string().min(1).max(50).default('Doca '),
    tipo: DocaTipoSchema,
    capacidadeVeiculos: z.number().int().positive().optional(),
    observacao: z.string().optional(),
  })
  .refine((data) => data.numeroInicial <= data.numeroFinal, {
    message: 'Número inicial deve ser menor ou igual ao final',
    path: ['numeroFinal'],
  })
  .refine((data) => data.numeroFinal - data.numeroInicial + 1 <= 100, {
    message: 'Intervalo máximo de 100 docas por operação',
    path: ['numeroFinal'],
  });

export type BulkCreateDocaInput = z.infer<typeof BulkCreateDocaInputSchema>;

export function buildDocaCodigoFromNumero(
  prefixo: string,
  numero: number,
  numeroFinal: number,
): string {
  const padLength = Math.max(2, String(numeroFinal).length);
  return `${prefixo}${String(numero).padStart(padLength, '0')}`;
}

export function buildDocaNomeFromNumero(
  prefixo: string,
  numero: number,
  numeroFinal: number,
): string {
  const padLength = Math.max(2, String(numeroFinal).length);
  return `${prefixo}${String(numero).padStart(padLength, '0')}`;
}

export function buildDocasFromInterval(
  input: BulkCreateDocaInput,
): CreateDocaInput[] {
  const items: CreateDocaInput[] = [];

  for (let numero = input.numeroInicial; numero <= input.numeroFinal; numero++) {
    items.push({
      unidadeId: input.unidadeId,
      codigo: buildDocaCodigoFromNumero(
        input.codigoPrefixo,
        numero,
        input.numeroFinal,
      ),
      nome: buildDocaNomeFromNumero(
        input.nomePrefixo,
        numero,
        input.numeroFinal,
      ),
      tipo: input.tipo,
      capacidadeVeiculos: input.capacidadeVeiculos,
      observacao: input.observacao,
    });
  }

  return items;
}

export const UpdateDocaInputSchema = z.object({
  codigo: z.string().min(1).max(50).optional(),
  nome: z.string().min(1).max(255).optional(),
  tipo: DocaTipoSchema.optional(),
  capacidadeVeiculos: z.number().int().positive().nullable().optional(),
  observacao: z.string().nullable().optional(),
  situacao: DocaSituacaoSchema.optional(),
});

export type UpdateDocaInput = z.infer<typeof UpdateDocaInputSchema>;

export const OperacaoDocaSchema = z.object({
  id: z.uuid(),
  docaId: z.uuid(),
  tipoOperacao: OperacaoDocaTipoSchema,
  veiculoId: z.uuid(),
  transportadoraId: z.uuid(),
  motorista: z.string().nullable(),
  dataPrevista: z.coerce.date().nullable(),
  dataInicio: z.coerce.date().nullable(),
  dataFim: z.coerce.date().nullable(),
  situacao: OperacaoDocaSituacaoSchema,
  prioridade: OperacaoDocaPrioridadeSchema,
  observacao: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type OperacaoDoca = z.infer<typeof OperacaoDocaSchema>;

export const CreateOperacaoDocaInputSchema = z.object({
  docaId: z.uuid(),
  tipoOperacao: OperacaoDocaTipoSchema,
  veiculoId: z.uuid(),
  transportadoraId: z.uuid(),
  motorista: z.string().optional(),
  dataPrevista: z.coerce.date().optional(),
  prioridade: OperacaoDocaPrioridadeSchema.default('normal'),
  observacao: z.string().optional(),
});

export type CreateOperacaoDocaInput = z.infer<
  typeof CreateOperacaoDocaInputSchema
>;
