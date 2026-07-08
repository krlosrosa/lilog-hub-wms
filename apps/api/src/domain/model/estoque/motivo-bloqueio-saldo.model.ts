import { z } from 'zod';

export const OrigemMotivoBloqueioSaldoSchema = z.enum([
  'recebimento',
  'inventario',
  'manual',
  'qualidade',
  'devolucao',
  'sistema',
]);

export type OrigemMotivoBloqueioSaldo = z.infer<
  typeof OrigemMotivoBloqueioSaldoSchema
>;

export const MotivoBloqueioSaldoSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string().min(1),
  codigo: z.string().min(1).max(50),
  nome: z.string().min(1).max(100),
  descricao: z.string().max(255).nullable(),
  origem: OrigemMotivoBloqueioSaldoSchema,
  ativo: z.boolean(),
  sistema: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type MotivoBloqueioSaldo = z.infer<typeof MotivoBloqueioSaldoSchema>;

export const CreateMotivoBloqueioSaldoInputSchema = z.object({
  unidadeId: z.string().min(1).max(50),
  codigo: z.string().min(1).max(50),
  nome: z.string().min(1).max(100),
  descricao: z.string().max(255).optional(),
  origem: OrigemMotivoBloqueioSaldoSchema.default('manual'),
});

export type CreateMotivoBloqueioSaldoInput = z.infer<
  typeof CreateMotivoBloqueioSaldoInputSchema
>;

export const UpdateMotivoBloqueioSaldoInputSchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  descricao: z.string().max(255).nullable().optional(),
  ativo: z.boolean().optional(),
});

export type UpdateMotivoBloqueioSaldoInput = z.infer<
  typeof UpdateMotivoBloqueioSaldoInputSchema
>;

export const SYSTEM_MOTIVOS_BLOQUEIO_SALDO: ReadonlyArray<{
  codigo: string;
  nome: string;
  descricao: string;
  origem: OrigemMotivoBloqueioSaldo;
}> = [
  {
    codigo: 'RECEBIMENTO_SOBRA',
    nome: 'Sobra na conferência',
    descricao: 'Quantidade conferida acima do esperado no recebimento',
    origem: 'recebimento',
  },
  {
    codigo: 'RECEBIMENTO_PRODUTO_NAO_ESPERADO',
    nome: 'Produto não esperado',
    descricao: 'Produto conferido fora da lista do pré-recebimento',
    origem: 'recebimento',
  },
  {
    codigo: 'RECEBIMENTO_AVARIA',
    nome: 'Avaria no recebimento',
    descricao: 'Lote marcado com avaria durante a conferência de recebimento',
    origem: 'recebimento',
  },
];
