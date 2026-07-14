import { HttpException, Injectable } from '@nestjs/common';

import type { FuncionarioCargo } from '../../../domain/model/funcionario/funcionario.model.js';
import { AddEquipeFuncionarioUseCase } from '../sessao-operacao/add-equipe-funcionario.usecase.js';
import { CreateFuncionarioUseCase } from './create-funcionario.usecase.js';

export type BulkFuncionarioItem = {
  unidadeId: string;
  matricula: string;
  nome: string;
  cargo: FuncionarioCargo;
  dataAdmissao: Date;
  equipeId: string;
  criarUsuario: boolean;
  senhaInicial?: string;
};

export type BulkImportFuncionarioFalha = {
  matricula: string;
  erro: string;
};

export type BulkImportFuncionariosResult = {
  total: number;
  sucesso: number;
  falhas: BulkImportFuncionarioFalha[];
};

function extractErrorMessage(error: unknown): string {
  if (error instanceof HttpException) {
    const response = error.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object' && response && 'message' in response) {
      const message = (response as { message: unknown }).message;

      if (Array.isArray(message)) {
        return message.join(', ');
      }

      return String(message);
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Erro desconhecido';
}

@Injectable()
export class BulkImportFuncionariosUseCase {
  constructor(
    private readonly createFuncionarioUseCase: CreateFuncionarioUseCase,
    private readonly addEquipeFuncionarioUseCase: AddEquipeFuncionarioUseCase,
  ) {}

  async execute(
    items: BulkFuncionarioItem[],
  ): Promise<BulkImportFuncionariosResult> {
    const results = await Promise.allSettled(
      items.map(async (item) => {
        const { equipeId, criarUsuario, senhaInicial, dataAdmissao, ...funcionarioData } =
          item;

        const created = await this.createFuncionarioUseCase.execute({
          ...funcionarioData,
          dataAdmissao,
          situacao: 'ativo',
          criarUsuarioAdmin: criarUsuario,
          usuarioSenha: senhaInicial,
          usuarioMustChangePassword: criarUsuario,
          role: 'operator',
          unidadesIds: [item.unidadeId],
        });

        await this.addEquipeFuncionarioUseCase.execute(
          equipeId,
          created.funcionario.id,
        );

        return item.matricula;
      }),
    );

    const falhas: BulkImportFuncionarioFalha[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        return;
      }

      falhas.push({
        matricula: items[index]!.matricula,
        erro: extractErrorMessage(result.reason),
      });
    });

    return {
      total: items.length,
      sucesso: items.length - falhas.length,
      falhas,
    };
  }
}
