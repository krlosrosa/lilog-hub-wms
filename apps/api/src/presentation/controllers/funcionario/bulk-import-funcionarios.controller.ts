import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { BulkImportFuncionariosUseCase } from '../../../application/usecases/funcionario/bulk-import-funcionarios.usecase.js';
import { FuncionarioCargoInputSchema } from '../../../domain/model/funcionario/funcionario.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const BulkFuncionarioItemSchema = z
  .object({
    unidadeId: z.string().min(1).max(50),
    matricula: z
      .string()
      .min(1)
      .max(50)
      .regex(/^\d+$/, 'Matrícula deve ser um ID numérico'),
    nome: z.string().min(1).max(100),
    cargo: FuncionarioCargoInputSchema,
    dataAdmissao: z.iso.date(),
    equipeId: z.uuid(),
    criarUsuario: z.boolean(),
    senhaInicial: z.string().min(6).optional(),
  })
  .refine((data) => !data.criarUsuario || Boolean(data.senhaInicial), {
    message: 'Informe a senha inicial para criar usuário',
    path: ['senhaInicial'],
  });

const BulkImportFuncionariosBodySchema = z.object({
  funcionarios: z.array(BulkFuncionarioItemSchema).min(1).max(200),
});

const BulkImportFuncionariosResponseSchema = z.object({
  total: z.number().int(),
  sucesso: z.number().int(),
  falhas: z.array(
    z.object({
      matricula: z.string(),
      erro: z.string(),
    }),
  ),
});

class BulkImportFuncionariosBodyDto extends createZodDto(
  BulkImportFuncionariosBodySchema,
) {}

class BulkImportFuncionariosResponseDto extends createZodDto(
  BulkImportFuncionariosResponseSchema,
) {}

@ApiTags('Funcionario')
@Controller('funcionarios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class BulkImportFuncionariosController {
  constructor(
    private readonly bulkImportFuncionariosUseCase: BulkImportFuncionariosUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.FUNCIONARIO_CREATE)
  @Auditable({ action: 'bulk_import', resource: 'funcionario' })
  @Post('bulk')
  @ApiOperation({
    summary: 'Bulk import funcionarios',
    operationId: 'bulkImportFuncionarios',
  })
  @ApiSuccessResponse(BulkImportFuncionariosResponseDto, 'created')
  async handle(@Body() body: BulkImportFuncionariosBodyDto) {
    const funcionarios = body.funcionarios.map((item) => ({
      ...item,
      dataAdmissao: new Date(item.dataAdmissao),
    }));

    return this.bulkImportFuncionariosUseCase.execute(funcionarios);
  }
}
