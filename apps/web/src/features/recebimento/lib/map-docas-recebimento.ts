import type { DocaApi } from '@/features/docas/types/doca.api';
import type { DocaSituacao } from '@/features/docas/types/docas.schema';
import type {
  DocaItem,
  DocaStatus,
} from '@/features/recebimento/types/recebimento-lista.schema';

export type DocaSelecaoItem = DocaItem & {
  id: string;
  codigo: string;
  nome: string;
};

function mapDocaSituacaoToStatus(situacao: DocaSituacao): DocaStatus {
  switch (situacao) {
    case 'disponivel':
      return 'disponivel';
    case 'ocupada':
    case 'reservada':
      return 'ocupada';
    case 'manutencao':
    case 'bloqueada':
    default:
      return 'manutencao';
  }
}

function parseDocaNumero(codigo: string): number {
  return (
    Number.parseInt(codigo.replace(/\D/g, ''), 10) ||
    Number.parseInt(codigo, 10) ||
    1
  );
}

export function mapDocaApiToSelecaoItem(doca: DocaApi): DocaSelecaoItem {
  const status = mapDocaSituacaoToStatus(doca.situacao);

  return {
    id: doca.id,
    codigo: doca.codigo,
    nome: doca.nome,
    numero: parseDocaNumero(doca.codigo),
    status,
    capacidadeToneladas: doca.capacidadeVeiculos ?? undefined,
    etiquetaManutencao: status === 'manutencao' ? 'MANUT' : undefined,
  };
}

export function sortDocasSelecao(items: readonly DocaSelecaoItem[]): DocaSelecaoItem[] {
  return [...items].sort((a, b) =>
    a.codigo.localeCompare(b.codigo, 'pt-BR', { numeric: true }),
  );
}
