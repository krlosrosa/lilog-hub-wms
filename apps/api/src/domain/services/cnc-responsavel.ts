import type { CncResponsavel } from '../model/cnc/cnc.model.js';

const DIVERGENCIA_FORNECEDOR = new Set([
  'quantidade_maior',
  'quantidade_menor',
  'produto_nao_esperado',
  'produto_ausente',
  'divergencia_lote',
  'divergencia_peso',
  'divergencia_validade',
]);

export function inferFromAvariaNatureza(natureza: string): CncResponsavel {
  const normalized = natureza.toLowerCase();

  if (normalized.includes('transporte')) {
    return 'transportadora';
  }

  if (normalized.includes('embalagem')) {
    return 'fornecedor';
  }

  if (normalized.includes('manuseio')) {
    return 'operacao';
  }

  return 'indeterminado';
}

export function inferCncResponsavel(input: {
  divergencias: Array<{ tipo: string }>;
  avarias: Array<{ natureza: string }>;
}): CncResponsavel {
  const responsaveis = new Set<CncResponsavel>();

  for (const divergencia of input.divergencias) {
    if (DIVERGENCIA_FORNECEDOR.has(divergencia.tipo)) {
      responsaveis.add('fornecedor');
    } else {
      responsaveis.add('indeterminado');
    }
  }

  for (const avaria of input.avarias) {
    responsaveis.add(inferFromAvariaNatureza(avaria.natureza));
  }

  if (responsaveis.size === 1) {
    return [...responsaveis][0]!;
  }

  return 'indeterminado';
}

export function inferResponsavelId(
  responsavel: CncResponsavel,
  transportadoraId: string,
): string | null {
  if (responsavel === 'transportadora') {
    return transportadoraId;
  }

  return null;
}
