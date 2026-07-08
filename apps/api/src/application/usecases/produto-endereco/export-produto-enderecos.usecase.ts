import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  buildProdutoEnderecosXlsx,
  type ProdutoEnderecoExportRow,
} from '../../services/produto-endereco/build-produto-enderecos-xlsx.js';
import type { EnderecoTipo } from '../../../domain/model/endereco/endereco.model.js';
import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../domain/repositories/endereco/endereco.repository.js';
import {
  PRODUTO_ENDERECO_REPOSITORY,
  type IProdutoEnderecoRepository,
  type ProdutoEnderecoRecord,
} from '../../../domain/repositories/produto-endereco/produto-endereco.repository.js';
import {
  UNIDADE_REPOSITORY,
  type IUnidadeRepository,
} from '../../../domain/repositories/unidade/unidade.repository.js';

export type ExportProdutoEnderecosFilter = {
  centroId: string;
  unidadeId?: string;
  tipo?: EnderecoTipo;
  search?: string;
  slotting?: 'com_produto' | 'sem_produto';
};

export type ExportProdutoEnderecosResult = {
  buffer: Buffer;
  filename: string;
};

const EXPORT_PAGE_SIZE = 500;

function escolherAlocacaoPrincipal(
  alocacoes: ProdutoEnderecoRecord[],
): ProdutoEnderecoRecord | undefined {
  if (alocacoes.length === 0) return undefined;

  const ativas = alocacoes.filter((item) => item.ativo);
  const pool = ativas.length > 0 ? ativas : alocacoes;

  const primaria = pool.find((item) => item.papel === 'picking_primario');
  if (primaria) return primaria;

  return [...pool].sort((a, b) => a.ordem - b.ordem)[0];
}

@Injectable()
export class ExportProdutoEnderecosUseCase {
  constructor(
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
    @Inject(PRODUTO_ENDERECO_REPOSITORY)
    private readonly produtoEnderecoRepository: IProdutoEnderecoRepository,
    @Inject(UNIDADE_REPOSITORY)
    private readonly unidadeRepository: IUnidadeRepository,
  ) {}

  async execute(
    filter: ExportProdutoEnderecosFilter,
  ): Promise<ExportProdutoEnderecosResult> {
    if (!filter.centroId) {
      throw new BadRequestException('centroId é obrigatório para exportação');
    }

    const unidadeId = await this.resolveUnidadeId(filter);
    const enderecos = await this.listarTodosEnderecos(filter, unidadeId);
    const alocacoes = await this.listarTodasAlocacoes(filter.centroId, filter.unidadeId);

    const mapaAlocacoes = new Map<string, ProdutoEnderecoRecord[]>();

    for (const alocacao of alocacoes) {
      const lista = mapaAlocacoes.get(alocacao.enderecoId) ?? [];
      lista.push(alocacao);
      mapaAlocacoes.set(alocacao.enderecoId, lista);
    }

    const rows: ProdutoEnderecoExportRow[] = [];

    for (const endereco of enderecos) {
      const alocacao = escolherAlocacaoPrincipal(
        mapaAlocacoes.get(endereco.id) ?? [],
      );

      if (filter.slotting === 'com_produto' && !alocacao) {
        continue;
      }

      if (filter.slotting === 'sem_produto' && alocacao) {
        continue;
      }

      rows.push({
        centroId: filter.centroId,
        enderecoMascarado: endereco.enderecoMascarado,
        sku: alocacao?.produto.sku ?? '',
        produtoId: alocacao?.produtoId ?? '',
        papel: alocacao?.papel ?? '',
        ordem: alocacao?.ordem ?? '',
        ativo: alocacao ? alocacao.ativo : '',
      });
    }

    const buffer = buildProdutoEnderecosXlsx(rows);

    return {
      buffer,
      filename: `produto-enderecos-${new Date().toISOString().slice(0, 10)}.xlsx`,
    };
  }

  private async resolveUnidadeId(
    filter: ExportProdutoEnderecosFilter,
  ): Promise<string> {
    if (filter.unidadeId?.trim()) {
      return filter.unidadeId.trim();
    }

    const centros = await this.unidadeRepository.listCentros();
    const centro = centros.find((item) => item.id === filter.centroId);

    if (!centro) {
      throw new BadRequestException('Centro informado não encontrado');
    }

    return centro.unidadeId;
  }

  private async listarTodosEnderecos(
    filter: ExportProdutoEnderecosFilter,
    unidadeId: string,
  ) {
    const items = [];
    let page = 1;

    while (true) {
      const result = await this.enderecoRepository.list({
        page,
        limit: EXPORT_PAGE_SIZE,
        unidadeId,
        tipo: filter.tipo,
        search: filter.search,
      });

      items.push(...result.items);

      if (items.length >= result.total || result.items.length === 0) {
        break;
      }

      page += 1;
    }

    return items;
  }

  private async listarTodasAlocacoes(centroId: string, unidadeId?: string) {
    const items: ProdutoEnderecoRecord[] = [];
    let page = 1;

    while (true) {
      const result = await this.produtoEnderecoRepository.list({
        page,
        limit: EXPORT_PAGE_SIZE,
        centroId,
        unidadeId,
      });

      items.push(...result.items);

      if (items.length >= result.total || result.items.length === 0) {
        break;
      }

      page += 1;
    }

    return items;
  }
}
