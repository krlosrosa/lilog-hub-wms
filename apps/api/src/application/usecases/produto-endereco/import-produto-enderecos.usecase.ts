import { BadRequestException, Inject, Injectable } from '@nestjs/common';



import type { CreateProdutoEnderecoData } from '../../../domain/model/produto-endereco/produto-endereco.model.js';

import {

  ENDERECO_REPOSITORY,

  type IEnderecoRepository,

} from '../../../domain/repositories/endereco/endereco.repository.js';

import {

  PRODUTO_ENDERECO_REPOSITORY,

  type IProdutoEnderecoRepository,

} from '../../../domain/repositories/produto-endereco/produto-endereco.repository.js';

import {

  PRODUTO_REPOSITORY,

  type IProdutoRepository,

} from '../../../domain/repositories/produto/produto.repository.js';

import {

  UNIDADE_REPOSITORY,

  type IUnidadeRepository,

} from '../../../domain/repositories/unidade/unidade.repository.js';

import {

  assertEnderecoCompativelComAlocacao,

  mapProdutoEnderecoConstraintError,

} from '../../services/produto-endereco-validation.js';

import {

  parseProdutoEnderecosXlsx,

  type ErroImportacaoProdutoEndereco,

} from '../../services/produto-endereco/parse-produto-enderecos-xlsx.js';



export type ImportProdutoEnderecosResult = {

  total: number;

  inserted: number;

  updated: number;

  errors: ErroImportacaoProdutoEndereco[];

};



@Injectable()

export class ImportProdutoEnderecosUseCase {

  constructor(

    @Inject(PRODUTO_ENDERECO_REPOSITORY)

    private readonly produtoEnderecoRepository: IProdutoEnderecoRepository,

    @Inject(ENDERECO_REPOSITORY)

    private readonly enderecoRepository: IEnderecoRepository,

    @Inject(PRODUTO_REPOSITORY)

    private readonly produtoRepository: IProdutoRepository,

    @Inject(UNIDADE_REPOSITORY)

    private readonly unidadeRepository: IUnidadeRepository,

  ) {}



  async execute(arquivo: Buffer): Promise<ImportProdutoEnderecosResult> {

    if (!arquivo?.length) {

      throw new BadRequestException('Arquivo vazio ou ausente');

    }



    const { items, erros } = parseProdutoEnderecosXlsx(arquivo);

    const errors = [...erros];

    const validRows: CreateProdutoEnderecoData[] = [];

    const centroUnidadeMap = new Map(

      (await this.unidadeRepository.listCentros()).map((centro) => [

        centro.id,

        centro.unidadeId,

      ]),

    );



    for (const row of items) {

      const produto = await this.resolverProduto(row.sku, row.produtoId);



      if (!produto) {

        errors.push({

          linha: row.linha,

          endereco: row.enderecoMascarado,

          sku: row.sku,

          campo: row.sku ? 'SKU' : 'Produto ID',

          mensagem: row.sku

            ? `Produto com SKU "${row.sku}" não encontrado`

            : `Produto com ID "${row.produtoId}" não encontrado`,

        });

        continue;

      }



      const centroUnidadeId = centroUnidadeMap.get(row.centroId);



      if (!centroUnidadeId) {

        errors.push({

          linha: row.linha,

          endereco: row.enderecoMascarado,

          sku: row.sku || produto.sku,

          campo: 'Centro ID',

          mensagem: `Centro "${row.centroId}" não encontrado`,

        });

        continue;

      }



      const endereco = await this.enderecoRepository.findByUnidadeAndCodigo(

        centroUnidadeId,

        row.enderecoMascarado,

      );



      if (!endereco) {

        errors.push({

          linha: row.linha,

          endereco: row.enderecoMascarado,

          sku: row.sku || produto.sku,

          campo: 'Endereço',

          mensagem: `Endereço "${row.enderecoMascarado}" não encontrado na unidade do centro informado`,

        });

        continue;

      }



      try {

        assertEnderecoCompativelComAlocacao(

          endereco,

          centroUnidadeId,

          row.papel,

        );

      } catch (error) {

        errors.push({

          linha: row.linha,

          endereco: row.enderecoMascarado,

          sku: produto.sku,

          campo: 'Papel',

          mensagem:

            error instanceof Error

              ? error.message

              : 'Endereço incompatível com o papel informado',

        });

        continue;

      }



      validRows.push({

        centroId: row.centroId,

        produtoId: produto.produtoId,

        enderecoId: endereco.id,

        papel: row.papel,

        ordem: row.ordem,

        ativo: row.ativo,

      });

    }



    const dedupedRows = this.deduplicarLinhas(validRows);



    if (dedupedRows.length === 0) {

      return {

        total: items.length + erros.length,

        inserted: 0,

        updated: 0,

        errors,

      };

    }



    try {

      const { inserted, updated } =

        await this.produtoEnderecoRepository.upsertBulk(dedupedRows);



      return {

        total: items.length + erros.length,

        inserted,

        updated,

        errors,

      };

    } catch (error) {

      mapProdutoEnderecoConstraintError(error);

    }

  }



  private async resolverProduto(sku: string, produtoId: string) {

    if (sku) {

      const bySku = await this.produtoRepository.findBySku(sku);

      if (bySku) return bySku;

    }



    if (produtoId) {

      const byId = await this.produtoRepository.findByProdutoId(produtoId);

      if (byId) return byId;



      return this.produtoRepository.resolvePorCodigo(produtoId);

    }



    return null;

  }



  private deduplicarLinhas(rows: CreateProdutoEnderecoData[]) {

    const map = new Map<string, CreateProdutoEnderecoData>();



    for (const row of rows) {

      map.set(`${row.produtoId}::${row.enderecoId}`, row);

    }



    return [...map.values()];

  }

}


