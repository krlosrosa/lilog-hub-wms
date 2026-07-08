import { z } from 'zod';

export const DepositoFinalidadeSchema = z.enum([
  'transferencia',
  'aguardando_armazenagem',
  'geral',
  'quarentena',
  'debito_transportadora',
  'acerto_transferencia',
  'reserva',
  'avaria',
  'bloqueado',
]);

export type DepositoFinalidade = z.infer<typeof DepositoFinalidadeSchema>;

export const DepositoCodigoSchema = z.enum([
  'TRANSF',
  'AGUARD_ARM',
  'AVARIA',
  'DEB_TRANSP',
  'QUARENTENA',
  'GERAL',
  'ACERTO_TRANSF',
  'RESERVA',
  'BLOQUEADO',
]);

export type DepositoCodigo = z.infer<typeof DepositoCodigoSchema>;

export const DepositoSchema = z.object({
  id: z.uuid(),
  unidadeId: z.string().min(1),
  codigo: z.string().min(1),
  nome: z.string().min(1),
  finalidade: DepositoFinalidadeSchema,
  permiteVenda: z.boolean(),
  permitePicking: z.boolean(),
  exigeEndereco: z.boolean(),
  contaDisponivel: z.boolean(),
  sistema: z.boolean(),
  ativo: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Deposito = z.infer<typeof DepositoSchema>;

export const SYSTEM_DEPOSITOS: ReadonlyArray<{
  codigo: DepositoCodigo;
  nome: string;
  finalidade: DepositoFinalidade;
  permiteVenda: boolean;
  permitePicking: boolean;
  exigeEndereco: boolean;
  contaDisponivel: boolean;
}> = [
  {
    codigo: 'TRANSF',
    nome: 'Transferência',
    finalidade: 'transferencia',
    permiteVenda: false,
    permitePicking: false,
    exigeEndereco: false,
    contaDisponivel: false,
  },
  {
    codigo: 'AGUARD_ARM',
    nome: 'Aguardando Armazenagem',
    finalidade: 'aguardando_armazenagem',
    permiteVenda: false,
    permitePicking: false,
    exigeEndereco: true,
    contaDisponivel: false,
  },
  {
    codigo: 'AVARIA',
    nome: 'Avaria',
    finalidade: 'avaria',
    permiteVenda: false,
    permitePicking: false,
    exigeEndereco: false,
    contaDisponivel: false,
  },
  {
    codigo: 'DEB_TRANSP',
    nome: 'Débito Transportadora',
    finalidade: 'debito_transportadora',
    permiteVenda: false,
    permitePicking: false,
    exigeEndereco: false,
    contaDisponivel: false,
  },
  {
    codigo: 'QUARENTENA',
    nome: 'Quarentena',
    finalidade: 'quarentena',
    permiteVenda: false,
    permitePicking: false,
    exigeEndereco: false,
    contaDisponivel: false,
  },
  {
    codigo: 'GERAL',
    nome: 'Geral',
    finalidade: 'geral',
    permiteVenda: true,
    permitePicking: true,
    exigeEndereco: true,
    contaDisponivel: true,
  },
];

export function buildRecebimentoDocumentoRef(recebimentoId: string): string {
  return `recebimento:${recebimentoId}`;
}

export function buildRecebimentoSaldoDocumentoRef(
  recebimentoId: string,
  params: {
    produtoId: string;
    lote: string | null;
    numeroSerie: string | null;
    classificacao:
      | 'liberado'
      | 'bloqueado_sobra'
      | 'bloqueado_nao_esperado'
      | 'bloqueado_avaria';
  },
): string {
  const lote = params.lote?.trim() ?? '';
  const numeroSerie = params.numeroSerie?.trim() ?? '';
  return `recebimento:${recebimentoId}:saldo:${params.produtoId}:${lote}:${numeroSerie}:${params.classificacao}`;
}

export function buildPreRecebimentoDocumentoRef(
  preRecebimentoId: string,
): string {
  return `recebimento:${preRecebimentoId}`;
}
