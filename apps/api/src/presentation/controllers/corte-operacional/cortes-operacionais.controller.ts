import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  CorteDetalheResponseDto,
  CorteIdParamDto,
  ListCortesQueryDto,
  ListCortesResponseDto,
} from '../../../application/dtos/corte-operacional/corte-operacional.dto.js';
import { CancelarCorteUseCase } from '../../../application/usecases/corte-operacional/cancelar-corte.usecase.js';
import { GetCorteUseCase } from '../../../application/usecases/corte-operacional/get-corte.usecase.js';
import { IniciarCorteUseCase } from '../../../application/usecases/corte-operacional/iniciar-corte.usecase.js';
import { ListCortesUseCase } from '../../../application/usecases/corte-operacional/list-cortes.usecase.js';
import { RealizarCorteUseCase } from '../../../application/usecases/corte-operacional/realizar-corte.usecase.js';
import { SolicitarCorteUseCase } from '../../../application/usecases/corte-operacional/solicitar-corte.usecase.js';
import { CorteItemInputSchema } from '../../../domain/model/corte-operacional/corte-operacional.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const SolicitarCorteBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  mapaGrupoId: z.uuid(),
  mapaGrupoMicroUuid: z.string().min(1).max(120),
  doca: z.string().max(50).optional(),
  motivo: z.string().max(2000).optional(),
  observacao: z.string().max(2000).optional(),
  itens: z.array(CorteItemInputSchema).min(1),
});

class SolicitarCorteBodyDto extends createZodDto(SolicitarCorteBodySchema) {}

const CancelarCorteBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  motivoCancelamento: z.string().min(1).max(2000),
});

class CancelarCorteBodyDto extends createZodDto(CancelarCorteBodySchema) {}

const CorteUnidadeQuerySchema = z.object({
  unidadeId: z.string().min(1).max(50),
});

class CorteUnidadeQueryDto extends createZodDto(CorteUnidadeQuerySchema) {}

@ApiTags('Corte Operacional')
@Controller('corte-operacional/cortes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CortesOperacionaisController {
  constructor(
    private readonly solicitarCorteUseCase: SolicitarCorteUseCase,
    private readonly listCortesUseCase: ListCortesUseCase,
    private readonly getCorteUseCase: GetCorteUseCase,
    private readonly iniciarCorteUseCase: IniciarCorteUseCase,
    private readonly realizarCorteUseCase: RealizarCorteUseCase,
    private readonly cancelarCorteUseCase: CancelarCorteUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Post()
  @ApiOperation({
    summary: 'Solicitar corte operacional',
    operationId: 'solicitarCorteOperacional',
  })
  @ApiSuccessResponse(CorteDetalheResponseDto, 'created')
  solicitar(
    @Body() body: SolicitarCorteBodyDto,
    @Request() req: FastifyRequest & { user: { id: number } },
  ) {
    return this.solicitarCorteUseCase.execute({
      ...body,
      solicitadoPor: req.user.id,
    });
  }

  @RequirePermissions(EXPEDICAO_PERMISSION.VISUALIZAR)
  @Get()
  @ApiOperation({
    summary: 'Listar cortes operacionais',
    operationId: 'listCortesOperacionais',
  })
  @ApiSuccessResponse(ListCortesResponseDto)
  listar(@Query() query: ListCortesQueryDto) {
    return this.listCortesUseCase.execute(query);
  }

  @RequirePermissions(EXPEDICAO_PERMISSION.VISUALIZAR)
  @Get(':id')
  @ApiOperation({
    summary: 'Obter detalhe do corte operacional',
    operationId: 'getCorteOperacional',
  })
  @ApiSuccessResponse(CorteDetalheResponseDto)
  obter(@Param() params: CorteIdParamDto, @Query() query: CorteUnidadeQueryDto) {
    return this.getCorteUseCase.execute({
      corteId: params.id,
      unidadeId: query.unidadeId,
    });
  }

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Post(':id/iniciar')
  @ApiOperation({
    summary: 'Iniciar realização do corte',
    operationId: 'iniciarCorteOperacional',
  })
  @ApiSuccessResponse(CorteDetalheResponseDto)
  iniciar(
    @Param() params: CorteIdParamDto,
    @Query() query: CorteUnidadeQueryDto,
    @Request() req: FastifyRequest & { user: { id: number } },
  ) {
    return this.iniciarCorteUseCase.execute({
      corteId: params.id,
      unidadeId: query.unidadeId,
      userId: req.user.id,
    });
  }

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Post(':id/realizar')
  @ApiOperation({
    summary: 'Concluir corte operacional',
    operationId: 'realizarCorteOperacional',
  })
  @ApiSuccessResponse(CorteDetalheResponseDto)
  realizar(
    @Param() params: CorteIdParamDto,
    @Query() query: CorteUnidadeQueryDto,
    @Request() req: FastifyRequest & { user: { id: number } },
  ) {
    return this.realizarCorteUseCase.execute({
      corteId: params.id,
      unidadeId: query.unidadeId,
      userId: req.user.id,
    });
  }

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Post(':id/cancelar')
  @ApiOperation({
    summary: 'Cancelar corte operacional',
    operationId: 'cancelarCorteOperacional',
  })
  @ApiSuccessResponse(CorteDetalheResponseDto)
  cancelar(
    @Param() params: CorteIdParamDto,
    @Body() body: CancelarCorteBodyDto,
    @Request() req: FastifyRequest & { user: { id: number } },
  ) {
    return this.cancelarCorteUseCase.execute({
      corteId: params.id,
      unidadeId: body.unidadeId,
      canceladoPor: req.user.id,
      motivoCancelamento: body.motivoCancelamento,
    });
  }
}
