import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListPessoasQueryDto,
  ListPessoasResponseDto,
} from '../../../application/dtos/pessoa/list-pessoas.dto.js';
import { ListPessoasUseCase } from '../../../application/usecases/pessoa/list-pessoas.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

function toPessoaResponse(pessoa: {
  funcionarioId: number;
  matricula: string;
  nome: string;
  cargo: string;
  situacao: string;
  unidadeId: string;
  dataAdmissao: Date;
  equipeId: string | null;
  equipeNome: string | null;
  userId: number | null;
  userStatus: string | null;
  userRole: string | null;
  mustChangePassword: boolean | null;
  userEmail: string | null;
}) {
  return {
    funcionarioId: pessoa.funcionarioId,
    matricula: pessoa.matricula,
    nome: pessoa.nome,
    cargo: pessoa.cargo,
    situacao: pessoa.situacao,
    unidadeId: pessoa.unidadeId,
    dataAdmissao: pessoa.dataAdmissao,
    equipeId: pessoa.equipeId,
    equipeNome: pessoa.equipeNome,
    userId: pessoa.userId,
    userStatus: pessoa.userStatus,
    userRole: pessoa.userRole,
    mustChangePassword: pessoa.mustChangePassword,
    userEmail: pessoa.userEmail,
  };
}

@ApiTags('Pessoa')
@Controller('pessoas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListPessoasController {
  constructor(private readonly listPessoasUseCase: ListPessoasUseCase) {}

  @RequirePermissions(USER_PERMISSION.FUNCIONARIO_VIEW)
  @Get()
  @ApiOperation({
    summary: 'List pessoas (funcionario + user agregado)',
    operationId: 'listPessoas',
  })
  @ApiSuccessResponse(ListPessoasResponseDto)
  async handle(@Query() query: ListPessoasQueryDto) {
    const result = await this.listPessoasUseCase.execute(query);

    return {
      ...result,
      items: result.items.map(toPessoaResponse),
    };
  }
}
