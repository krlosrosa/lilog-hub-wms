import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ListEnderecosResponseDto } from '../../../application/dtos/endereco/endereco.dto.js';
import { ListEnderecosDisponiveisArmazenagemUseCase } from '../../../application/usecases/armazenagem/list-enderecos-disponiveis-armazenagem.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const EnderecosDisponiveisParamsSchema = z.object({
  id: z.uuid(),
  itemId: z.uuid(),
});

class EnderecosDisponiveisParamsDto extends createZodDto(
  EnderecosDisponiveisParamsSchema,
) {}

const EnderecosDisponiveisTarefaParamsSchema = z.object({
  id: z.uuid(),
  tarefaId: z.uuid(),
});

class EnderecosDisponiveisTarefaParamsDto extends createZodDto(
  EnderecosDisponiveisTarefaParamsSchema,
) {}

const EnderecosDisponiveisQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

class EnderecosDisponiveisQueryDto extends createZodDto(
  EnderecosDisponiveisQuerySchema,
) {}

@ApiTags('Armazenagem')
@Controller('armazenagem/demandas')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ListEnderecosDisponiveisArmazenagemController {
  constructor(
    private readonly listEnderecosDisponiveisArmazenagemUseCase: ListEnderecosDisponiveisArmazenagemUseCase,
  ) {}

  @Get(':id/itens/:itemId/enderecos-disponiveis')
  @ApiOperation({
    summary: 'List available addresses for storage item',
    operationId: 'listEnderecosDisponiveisArmazenagem',
  })
  @ApiSuccessResponse(ListEnderecosResponseDto)
  handle(
    @Param() params: EnderecosDisponiveisParamsDto,
    @Query() query: EnderecosDisponiveisQueryDto,
  ) {
    return this.listEnderecosDisponiveisArmazenagemUseCase.execute({
      demandaId: params.id,
      itemId: params.itemId,
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
  }

  @Get(':id/tarefas/:tarefaId/enderecos-disponiveis')
  @ApiOperation({
    summary: 'List available addresses for storage task (pallet)',
    operationId: 'listEnderecosDisponiveisTarefaArmazenagem',
  })
  @ApiSuccessResponse(ListEnderecosResponseDto)
  handleTarefa(
    @Param() params: EnderecosDisponiveisTarefaParamsDto,
    @Query() query: EnderecosDisponiveisQueryDto,
  ) {
    return this.listEnderecosDisponiveisArmazenagemUseCase.execute({
      demandaId: params.id,
      tarefaId: params.tarefaId,
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
  }
}
