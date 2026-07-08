import type {
  DevolucaoNotaFiscalDetalhe,
  DevolucaoItemDetalhe,
} from '@/features/devolucao/types/devolucao-buscar.schema';
import type { FaltaPesoDetalhe } from '@/features/devolucao/types/devolucao-falta-peso.schema';
import { isFaltaPesoAtiva } from '@/features/devolucao/lib/falta-peso-status';

export type ItemPesoVariavelElegivel = {
  notaFiscalId: string;
  numeroNf: string;
  item: DevolucaoItemDetalhe;
};

export function resolveItensPesoVariavelElegiveis(
  notasFiscais: DevolucaoNotaFiscalDetalhe[],
  faltasPeso: FaltaPesoDetalhe[],
): ItemPesoVariavelElegivel[] {
  const itensComFaltaAtiva = new Set(
    faltasPeso
      .filter((falta) => isFaltaPesoAtiva(falta.status))
      .map((falta) => falta.itemId),
  );

  return notasFiscais.flatMap((nf) =>
    nf.itens
      .filter(
        (item) => item.pesoVariavel && !itensComFaltaAtiva.has(item.id),
      )
      .map((item) => ({
        notaFiscalId: nf.id,
        numeroNf: nf.numeroNf,
        item,
      })),
  );
}

export function hasItensPesoVariavel(
  notasFiscais: DevolucaoNotaFiscalDetalhe[],
): boolean {
  return notasFiscais.some((nf) =>
    nf.itens.some((item) => item.pesoVariavel),
  );
}

export function hasFaltaPesoPendente(faltasPeso: FaltaPesoDetalhe[]): boolean {
  return faltasPeso.some((falta) => falta.status === 'pendente');
}

export function resolveFaltasPesoAtivasPorItem(
  faltasPeso: FaltaPesoDetalhe[],
): Map<string, FaltaPesoDetalhe> {
  return new Map(
    faltasPeso
      .filter((falta) => isFaltaPesoAtiva(falta.status))
      .map((falta) => [falta.itemId, falta]),
  );
}
