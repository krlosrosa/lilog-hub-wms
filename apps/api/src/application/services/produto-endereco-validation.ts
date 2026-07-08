import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import {
  enderecoTiposCompativeisComPapel,
  type CreateProdutoEnderecoData,
  type ProdutoEnderecoPapel,
  type UpdateProdutoEnderecoData,
} from '../../domain/model/produto-endereco/produto-endereco.model.js';
import type { EnderecoRecord } from '../../domain/repositories/endereco/endereco.repository.js';

export function assertEnderecoCompativelComAlocacao(
  endereco: EnderecoRecord,
  unidadeId: string,
  papel: ProdutoEnderecoPapel,
) {
  if (endereco.unidadeId !== unidadeId) {
    throw new BadRequestException(
      'O endereço selecionado não pertence à unidade informada',
    );
  }

  const tiposCompativeis = enderecoTiposCompativeisComPapel(papel);

  if (!tiposCompativeis.includes(endereco.tipo)) {
    throw new BadRequestException(
      `Endereço do tipo "${endereco.tipo}" não é compatível com o papel "${papel}"`,
    );
  }
}

export function mapProdutoEnderecoConstraintError(error: unknown): never {
  const pgError = findPostgresUniqueViolation(error);

  if (!pgError) {
    throw error;
  }

  const constraint = pgError.constraint_name;

  if (constraint === 'produto_enderecos_produto_endereco_unique') {
    throw new ConflictException(
      'Este produto já está alocado neste endereço',
    );
  }

  throw new ConflictException(
    `Alocação duplicada ou conflitante (${constraint ?? 'constraint desconhecida'})`,
  );
}

function findPostgresUniqueViolation(
  error: unknown,
): { constraint_name?: string } | null {
  let current: unknown = error;

  while (current && typeof current === 'object') {
    const candidate = current as {
      code?: string;
      constraint_name?: string;
      cause?: unknown;
    };

    if (candidate.code === '23505') {
      return candidate;
    }

    current = candidate.cause;
  }

  return null;
}

export type ResolvedProdutoEnderecoMutation = {
  centroId: string;
  produtoId: string;
  enderecoId: string;
  papel: ProdutoEnderecoPapel;
  ordem: number;
  ativo: boolean;
};

export function resolveCreateMutation(
  data: CreateProdutoEnderecoData,
): ResolvedProdutoEnderecoMutation {
  return {
    centroId: data.centroId,
    produtoId: data.produtoId,
    enderecoId: data.enderecoId,
    papel: data.papel,
    ordem: data.ordem,
    ativo: data.ativo,
  };
}

export function resolveUpdateMutation(
  existing: ResolvedProdutoEnderecoMutation,
  data: UpdateProdutoEnderecoData,
): ResolvedProdutoEnderecoMutation {
  return {
    centroId: existing.centroId,
    produtoId: existing.produtoId,
    enderecoId: data.enderecoId ?? existing.enderecoId,
    papel: data.papel ?? existing.papel,
    ordem: data.ordem ?? existing.ordem,
    ativo: data.ativo ?? existing.ativo,
  };
}
