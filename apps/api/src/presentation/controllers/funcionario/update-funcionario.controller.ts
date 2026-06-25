import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { FuncionarioResponseDto } from '../../../application/dtos/funcionario/list-funcionarios.dto.js';
import { UpdateFuncionarioUseCase } from '../../../application/usecases/funcionario/update-funcionario.usecase.js';
import {
  FuncionarioCargoSchema,
  FuncionarioSituacaoSchema,
} from '../../../domain/model/funcionario/funcionario.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const UpdateFuncionarioBodySchema = z
  .object({
    unidadeId: z.string().min(1).max(50).optional(),
    matricula: z
      .string()
      .min(1)
      .max(50)
      .regex(/^\d+$/, 'Matrícula deve ser um ID numérico')
      .optional(),
    nome: z.string().min(1).max(100).optional(),
    cargo: FuncionarioCargoSchema.optional(),
    situacao: FuncionarioSituacaoSchema.optional(),
    dataAdmissao: z.iso.date().optional(),
    telefone: z.string().max(20).nullable().optional(),
    email: z.string().email().nullable().optional(),
    observacao: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualização',
  });

class UpdateFuncionarioBodyDto extends createZodDto(
  UpdateFuncionarioBodySchema,
) {}

@ApiTags('Funcionario')
@Controller('funcionarios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class UpdateFuncionarioController {
  constructor(
    private readonly updateFuncionarioUseCase: UpdateFuncionarioUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.FUNCIONARIO_UPDATE)
  @Auditable({ action: 'update', resource: 'funcionario' })
  @Patch(':id')
  @ApiOperation({
    summary: 'Update funcionario',
    operationId: 'updateFuncionario',
  })
  @ApiSuccessResponse(FuncionarioResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: UpdateFuncionarioBodyDto,
  ) {
    const { dataAdmissao, ...rest } = body;

    return this.updateFuncionarioUseCase.execute(Number(id), {
      ...rest,
      ...(dataAdmissao !== undefined
        ? { dataAdmissao: new Date(dataAdmissao) }
        : {}),
    });
  }
}
