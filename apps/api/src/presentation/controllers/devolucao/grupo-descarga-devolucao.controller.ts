import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  AtualizarStatusGrupoDescargaResponseDto,
  BuscarGrupoDescargaQueryDto,
  BuscarGrupoDescargaResponseDto,
  CriarGrupoDescargaResponseDto,
  DevolucaoGrupoDescargaStatusSchema,
  ListarGruposDescargaQueryDto,
  ListarGruposDescargaResponseDto,
  RegistrarConferenciaGrupoResponseDto,
} from '../../../application/dtos/devolucao/grupo-descarga-devolucao.dto.js';
import { DevolucaoItemCondicaoSchema } from '../../../application/dtos/devolucao/buscar-demanda-devolucao.dto.js';
import { AtualizarStatusGrupoDescargaDevolucaoUseCase } from '../../../application/usecases/devolucao/atualizar-status-grupo-descarga-devolucao.usecase.js';
import { BuscarGrupoDescargaDevolucaoUseCase } from '../../../application/usecases/devolucao/buscar-grupo-descarga-devolucao.usecase.js';
import { CriarGrupoDescargaDevolucaoUseCase } from '../../../application/usecases/devolucao/criar-grupo-descarga-devolucao.usecase.js';
import { ListarGruposDescargaDevolucaoUseCase } from '../../../application/usecases/devolucao/listar-grupos-descarga-devolucao.usecase.js';
import { RegistrarConferenciaGrupoDevolucaoUseCase } from '../../../application/usecases/devolucao/registrar-conferencia-grupo-devolucao.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { DEVOLUCAO_PERMISSION } from '../../../shared/constants/devolucao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const CriarGrupoDescargaBodySchema = z.object({
  unidadeId: z.string().min(1),
  demandaIds: z.array(z.uuid()).min(1),
  placaDescarga: z.string().min(1).max(20),
  doca: z.string().max(100).optional().nullable(),
  cargaSegregada: z.boolean().optional(),
  paletesEsperados: z.number().int().nonnegative().optional().nullable(),
  observacao: z.string().optional().nullable(),
  liberarConferencia: z.boolean().optional(),
});
class CriarGrupoDescargaBodyDto extends createZodDto(CriarGrupoDescargaBodySchema) {}

const AtualizarStatusGrupoDescargaBodySchema = z.object({
  unidadeId: z.string().min(1),
  status: DevolucaoGrupoDescargaStatusSchema,
  observacao: z.string().optional().nullable(),
});
class AtualizarStatusGrupoDescargaBodyDto extends createZodDto(
  AtualizarStatusGrupoDescargaBodySchema,
) {}

const RegistrarConferenciaGrupoBodySchema = z.object({
  unidadeId: z.string().min(1),
  status: z
    .enum(['em_conferencia', 'conferida', 'concluida'])
    .optional(),
  itens: z
    .array(
      z.object({
        itemId: z.uuid(),
        condicao: DevolucaoItemCondicaoSchema.optional(),
        qtdConferida: z.number(),
        lote: z.string().nullable().optional(),
        dataFabricacao: z.string().nullable().optional(),
        observacao: z.string().nullable().optional(),
      }),
    )
    .optional(),
  itensNaoContabeis: z
    .array(
      z.object({
        sku: z.string().min(1),
        descricaoProduto: z.string().nullable().optional(),
        quantidadeConferida: z.number().positive(),
        unidadeMedida: z.string().min(1),
        lote: z.string().nullable().optional(),
        dataFabricacao: z.string().nullable().optional(),
        condicao: DevolucaoItemCondicaoSchema.optional(),
        observacao: z.string().nullable().optional(),
        demandaId: z.uuid().nullable().optional(),
      }),
    )
    .optional(),
});
class RegistrarConferenciaGrupoBodyDto extends createZodDto(
  RegistrarConferenciaGrupoBodySchema,
) {}

@ApiTags('Devolucao')
@Controller('devolucao/grupos-descarga')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CriarGrupoDescargaDevolucaoController {
  constructor(
    private readonly criarGrupoDescargaUseCase: CriarGrupoDescargaDevolucaoUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'create', resource: 'devolucao_grupo_descarga' })
  @Post()
  @ApiOperation({
    summary: 'Criar grupo de descarga agrupada',
    operationId: 'criarGrupoDescargaDevolucao',
  })
  @ApiSuccessResponse(CriarGrupoDescargaResponseDto, 'created')
  handle(@Body() body: CriarGrupoDescargaBodyDto) {
    return this.criarGrupoDescargaUseCase.execute(body);
  }
}

@ApiTags('Devolucao')
@Controller('devolucao/grupos-descarga')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListarGruposDescargaDevolucaoController {
  constructor(
    private readonly listarGruposDescargaUseCase: ListarGruposDescargaDevolucaoUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.VISUALIZAR)
  @Get()
  @ApiOperation({
    summary: 'Listar grupos de descarga da unidade',
    operationId: 'listarGruposDescargaDevolucao',
  })
  @ApiSuccessResponse(ListarGruposDescargaResponseDto)
  handle(@Query() query: ListarGruposDescargaQueryDto) {
    return this.listarGruposDescargaUseCase.execute(query);
  }
}

@ApiTags('Devolucao')
@Controller('devolucao/grupos-descarga')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class BuscarGrupoDescargaDevolucaoController {
  constructor(
    private readonly buscarGrupoDescargaUseCase: BuscarGrupoDescargaDevolucaoUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.VISUALIZAR)
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar detalhe de grupo de descarga',
    operationId: 'buscarGrupoDescargaDevolucao',
  })
  @ApiSuccessResponse(BuscarGrupoDescargaResponseDto)
  handle(@Param('id') id: string, @Query() query: BuscarGrupoDescargaQueryDto) {
    return this.buscarGrupoDescargaUseCase.execute({
      grupoId: id,
      unidadeId: query.unidadeId,
    });
  }
}

@ApiTags('Devolucao')
@Controller('devolucao/grupos-descarga')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AtualizarStatusGrupoDescargaDevolucaoController {
  constructor(
    private readonly atualizarStatusGrupoUseCase: AtualizarStatusGrupoDescargaDevolucaoUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'update', resource: 'devolucao_grupo_descarga' })
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Atualizar status do grupo de descarga',
    operationId: 'atualizarStatusGrupoDescargaDevolucao',
  })
  @ApiSuccessResponse(AtualizarStatusGrupoDescargaResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: AtualizarStatusGrupoDescargaBodyDto,
  ) {
    return this.atualizarStatusGrupoUseCase.execute({
      grupoId: id,
      unidadeId: body.unidadeId,
      status: body.status,
      observacao: body.observacao,
    });
  }
}

@ApiTags('Devolucao')
@Controller('devolucao/grupos-descarga')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class RegistrarConferenciaGrupoDevolucaoController {
  constructor(
    private readonly registrarConferenciaGrupoUseCase: RegistrarConferenciaGrupoDevolucaoUseCase,
  ) {}

  @RequirePermissions(DEVOLUCAO_PERMISSION.GERENCIAR)
  @Auditable({ action: 'update', resource: 'devolucao_grupo_conferencia' })
  @Patch(':id/conferencia')
  @ApiOperation({
    summary: 'Registrar conferência de grupo de descarga',
    operationId: 'registrarConferenciaGrupoDevolucao',
  })
  @ApiSuccessResponse(RegistrarConferenciaGrupoResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: RegistrarConferenciaGrupoBodyDto,
  ) {
    return this.registrarConferenciaGrupoUseCase.execute({
      grupoId: id,
      unidadeId: body.unidadeId,
      status: body.status,
      itens: body.itens,
      itensNaoContabeis: body.itensNaoContabeis,
    });
  }
}
