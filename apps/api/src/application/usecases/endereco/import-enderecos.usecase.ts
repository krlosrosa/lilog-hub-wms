import { BadRequestException, Inject, Injectable } from '@nestjs/common';



import {

  CreateEnderecoInputSchema,

  buildEnderecoCodigo,

  type CreateEnderecoData,

} from '../../../domain/model/endereco/endereco.model.js';

import {

  ENDERECO_REPOSITORY,

  type IEnderecoRepository,

} from '../../../domain/repositories/endereco/endereco.repository.js';

import {

  UNIDADE_REPOSITORY,

  type IUnidadeRepository,

} from '../../../domain/repositories/unidade/unidade.repository.js';

import {

  parseEnderecosXlsx,

  type ErroImportacaoEndereco,

} from '../../services/endereco/parse-enderecos-xlsx.js';



export type ImportEnderecosResult = {

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

export class ImportEnderecosUseCase {

  constructor(

    @Inject(ENDERECO_REPOSITORY)

    private readonly enderecoRepository: IEnderecoRepository,

    @Inject(UNIDADE_REPOSITORY)

    private readonly unidadeRepository: IUnidadeRepository,

  ) {}



  async execute(

    arquivo: Buffer,

    unidadeId: string,

  ): Promise<ImportEnderecosResult> {

    if (!arquivo?.length) {

      throw new BadRequestException('Arquivo vazio ou ausente');

    }



    const trimmedUnidadeId = unidadeId?.trim();



    if (!trimmedUnidadeId) {

      throw new BadRequestException(

        'Unidade não informada. Selecione uma unidade antes de importar.',

      );

    }



    const unidade = await this.unidadeRepository.findById(trimmedUnidadeId);



    if (!unidade) {

      throw new BadRequestException(

        `Unidade "${trimmedUnidadeId}" não encontrada.`,

      );

    }



    const { items, erros } = parseEnderecosXlsx(arquivo, trimmedUnidadeId);

    const errors: ErroImportacaoEndereco[] = [...erros];

    const pending: PendingInsert[] = [];



    for (const row of items) {

      const parsed = CreateEnderecoInputSchema.safeParse(row);



      if (!parsed.success) {

        const issue = parsed.error.issues[0];

        errors.push({

          linha: row.linha,

          codigo: buildEnderecoCodigo(

            row.zona,

            row.rua ?? undefined,

            row.posicao ?? undefined,

            row.nivel ?? undefined,

          ),

          campo: issue?.path.join('.') || 'linha',

          mensagem: issue?.message || 'Dados inválidos na linha',

        });

        continue;

      }



      const existing = await this.enderecoRepository.findByUnidadeAndCodigo(

        parsed.data.unidadeId,

        parsed.data.enderecoMascarado,

      );



      if (existing) {

        errors.push({

          linha: row.linha,

          codigo: parsed.data.enderecoMascarado,

          campo: 'endereco',

          mensagem: `Endereço "${parsed.data.enderecoMascarado}" já existe nesta unidade`,

        });

        continue;

      }



      pending.push({

        linha: row.linha,

        codigo: parsed.data.enderecoMascarado,

        data: parsed.data,

      });

    }



    if (pending.length === 0) {

      return {

        total: items.length + erros.length,

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

      total: items.length + erros.length,

      inserted,

      errors,

    };

  }

}


