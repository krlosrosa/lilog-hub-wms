import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { CreateFuncionarioResponseDto } from '../../../application/dtos/funcionario/list-funcionarios.dto.js';
import { CreateFuncionarioUseCase } from '../../../application/usecases/funcionario/create-funcionario.usecase.js';
import {
  FuncionarioCargoInputSchema,
  FuncionarioSituacaoSchema,
} from '../../../domain/model/funcionario/funcionario.model.js';
import { UserRoleSchema } from '../../../domain/model/user/user.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { resolveAllRolePermissions } from '../../../shared/constants/permissions.js';
import { USER_PERMISSION } from '../../../shared/constants/user-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const CreateFuncionarioBodySchema = z
  .object({
    unidadeId: z.string().min(1).max(50),
    matricula: z
      .string()
      .min(1)
      .max(50)
      .regex(/^\d+$/, 'Matrícula deve ser um ID numérico'),
    nome: z.string().min(1).max(100),
    cargo: FuncionarioCargoInputSchema,
    situacao: FuncionarioSituacaoSchema.default('ativo'),
    dataAdmissao: z.iso.date(),
    telefone: z.string().max(20).optional(),
    email: z.string().email().optional(),
    observacao: z.string().optional(),
    criarUsuarioAdmin: z.boolean().default(false),
    usuarioSenha: z.string().min(6).optional(),
    role: UserRoleSchema.optional().default('operator'),
    unidadesIds: z.array(z.string().min(1)).optional(),
  })
  .refine(
    (data) => !data.criarUsuarioAdmin || Boolean(data.usuarioSenha),
    {
      message: 'Informe a senha para criar o usuário administrador',
      path: ['usuarioSenha'],
    },
  );

class CreateFuncionarioBodyDto extends createZodDto(
  CreateFuncionarioBodySchema,
) {}

type AuthenticatedRequest = {
  user?: {
    role: string;
  };
};

function toFuncionarioResponse(funcionario: {
  id: number;
  unidadeId: string;
  matricula: string;
  nome: string;
  cargo: string;
  situacao: string;
  dataAdmissao: Date;
  telefone?: string | null;
  email?: string | null;
  observacao?: string | null;
  createdAt: Date;
}) {
  return {
    id: funcionario.id,
    unidadeId: funcionario.unidadeId,
    matricula: funcionario.matricula,
    nome: funcionario.nome,
    cargo: funcionario.cargo,
    situacao: funcionario.situacao,
    dataAdmissao: funcionario.dataAdmissao,
    telefone: funcionario.telefone ?? null,
    email: funcionario.email ?? null,
    observacao: funcionario.observacao ?? null,
    createdAt: funcionario.createdAt,
  };
}

function toPublicUser(user: {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  funcionarioId: number | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    funcionarioId: user.funcionarioId,
    createdAt: user.createdAt,
  };
}

@ApiTags('Funcionario')
@Controller('funcionarios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreateFuncionarioController {
  constructor(
    private readonly createFuncionarioUseCase: CreateFuncionarioUseCase,
  ) {}

  @RequirePermissions(USER_PERMISSION.FUNCIONARIO_CREATE)
  @Auditable({ action: 'create', resource: 'funcionario' })
  @Post()
  @ApiOperation({
    summary: 'Create funcionario',
    operationId: 'createFuncionario',
  })
  @ApiSuccessResponse(CreateFuncionarioResponseDto, 'created')
  async handle(
    @Body() body: CreateFuncionarioBodyDto,
    @Req() request: AuthenticatedRequest,
  ) {
    if (body.criarUsuarioAdmin) {
      const role = request.user?.role;

      if (!role) {
        throw new ForbiddenException('Usuário não autenticado');
      }

      const permissions = resolveAllRolePermissions(role);

      if (!permissions.includes(USER_PERMISSION.USUARIO_CREATE)) {
        throw new ForbiddenException(
          'Sem permissão para criar usuário administrador',
        );
      }
    }

    const {
      criarUsuarioAdmin,
      usuarioSenha,
      role,
      unidadesIds,
      dataAdmissao,
      ...funcionarioData
    } = body;

    const result = await this.createFuncionarioUseCase.execute({
      ...funcionarioData,
      dataAdmissao: new Date(dataAdmissao),
      criarUsuarioAdmin,
      usuarioSenha,
      role,
      unidadesIds,
    });

    return {
      ...toFuncionarioResponse(result.funcionario),
      ...(result.usuario
        ? { usuario: toPublicUser(result.usuario) }
        : {}),
    };
  }
}
