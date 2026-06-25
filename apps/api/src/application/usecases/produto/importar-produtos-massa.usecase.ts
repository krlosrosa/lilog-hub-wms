import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  parseProdutosXlsx,
  type ErroImportacaoProduto,
} from '../../services/produto/parse-produtos-xlsx.js';
import {
  PRODUTO_REPOSITORY,
  type IProdutoRepository,
} from '../../../domain/repositories/produto/produto.repository.js';

export type ImportarProdutosMassaResult = {
  total: number;
  importados: number;
  duplicados: number;
  erros: ErroImportacaoProduto[];
};

@Injectable()
export class ImportarProdutosMassaUseCase {
  constructor(
    @Inject(PRODUTO_REPOSITORY)
    private readonly produtoRepository: IProdutoRepository,
  ) {}

  async execute(arquivo: Buffer): Promise<ImportarProdutosMassaResult> {
    if (!arquivo?.length) {
      throw new BadRequestException('Arquivo vazio ou ausente');
    }

    const { items, erros } = parseProdutosXlsx(arquivo);

    const totalLidos = items.length + erros.length;

    if (items.length === 0) {
      return { total: totalLidos, importados: 0, duplicados: 0, erros };
    }

    const { importados, duplicados } = await this.produtoRepository.bulkCreate(items);

    return { total: totalLidos, importados, duplicados, erros };
  }
}
