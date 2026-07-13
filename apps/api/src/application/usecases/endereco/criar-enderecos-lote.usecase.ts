import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import type { CreateEnderecoData } from '../../../domain/model/endereco/endereco.model.js';
import {
  ENDERECO_REPOSITORY,
  type IEnderecoRepository,
} from '../../../domain/repositories/endereco/endereco.repository.js';
import type { ErroImportacaoEndereco } from '../../services/endereco/parse-enderecos-xlsx.js';

export type CriarEnderecosLoteResult = {
  total: number;
  inserted: number;
  errors: ErroImportacaoEndereco[];
};

type PendingInsert = {
  linha: number;
  codigo: string;
  data: CreateEnderecoData;
};

@Injectable()
export class CriarEnderecosLoteUseCase {
  constructor(
    @Inject(ENDERECO_REPOSITORY)
    private readonly enderecoRepository: IEnderecoRepository,
  ) {}

  async execute(items: CreateEnderecoData[]): Promise<CriarEnderecosLoteResult> {
    if (!items.length) {
      throw new BadRequestException('Informe ao menos um endereço para cadastrar');
    }

    const errors: ErroImportacaoEndereco[] = [];
    const pending: PendingInsert[] = [];
    const codigosNoPayload = new Map<string, number>();

    for (let index = 0; index < items.length; index++) {
      const data = items[index]!;
      const linha = index + 1;
      const codigo = data.enderecoMascarado;

      const linhaDuplicada = codigosNoPayload.get(codigo);
      if (linhaDuplicada !== undefined) {
        errors.push({
          linha,
          codigo,
          campo: 'endereco',
          mensagem: `Endereço "${codigo}" duplicado no lote (já informado na linha ${linhaDuplicada})`,
        });
        continue;
      }

      codigosNoPayload.set(codigo, linha);

      const existing = await this.enderecoRepository.findByUnidadeAndCodigo(
        data.unidadeId,
        codigo,
      );

      if (existing) {
        errors.push({
          linha,
          codigo,
          campo: 'endereco',
          mensagem: `Endereço "${codigo}" já existe nesta unidade`,
        });
        continue;
      }

      pending.push({ linha, codigo, data });
    }

    if (pending.length === 0) {
      return {
        total: items.length,
        inserted: 0,
        errors,
      };
    }

    const { inserted, errors: bulkErrors } =
      await this.enderecoRepository.createBulk(pending.map((item) => item.data));

    for (const bulkError of bulkErrors) {
      const row = pending[bulkError.index];
      if (!row) {
        continue;
      }

      errors.push({
        linha: row.linha,
        codigo: row.codigo,
        campo: 'endereco',
        mensagem: bulkError.message,
      });
    }

    return {
      total: items.length,
      inserted,
      errors,
    };
  }
}
