import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { RecursosRecebimentoSessaoResponseDto } from '../../../application/dtos/recebimento/recursos-recebimento-sessao.dto.js';
import { GetRecursosRecebimentoSessaoUseCase } from '../../../application/usecases/recebimento/get-recursos-recebimento-sessao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const GetRecursosParamSchema = z.object({
  sessaoId: z.uuid(),
});

class GetRecursosParamDto extends createZodDto(GetRecursosParamSchema) {}

const GetRecursosQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

class GetRecursosQueryDto extends createZodDto(GetRecursosQuerySchema) {}

@ApiTags('Recebimento')
@Controller('recebimentos/sessoes/:sessaoId/recursos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetRecursosRecebimentoSessaoController {
  constructor(
    private readonly getRecursosRecebimentoSessaoUseCase: GetRecursosRecebimentoSessaoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.VISUALIZAR)
  @Get()
  @ApiOperation({
    summary: 'Listar recursos da sessão de recebimento (equipe + demandas)',
    operationId: 'getRecursosRecebimentoSessao',
  })
  @ApiSuccessResponse(RecursosRecebimentoSessaoResponseDto)
  handle(
    @Param() params: GetRecursosParamDto,
    @Query() query: GetRecursosQueryDto,
  ) {
    return this.getRecursosRecebimentoSessaoUseCase.execute(
      params.sessaoId,
      query.unidadeId,
    );
  }
}
