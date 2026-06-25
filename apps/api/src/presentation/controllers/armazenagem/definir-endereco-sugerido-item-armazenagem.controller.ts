import {
  Body,
  Controller,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ItemArmazenagemResponseDto } from '../../../application/dtos/armazenagem/armazenagem.dto.js';
import { DefinirEnderecoSugeridoItemArmazenagemUseCase } from '../../../application/usecases/armazenagem/definir-endereco-sugerido-item-armazenagem.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const DefinirEnderecoSugeridoParamsSchema = z.object({
  id: z.uuid(),
  itemId: z.uuid(),
});

class DefinirEnderecoSugeridoParamsDto extends createZodDto(
  DefinirEnderecoSugeridoParamsSchema,
) {}

const DefinirEnderecoSugeridoBodySchema = z.object({
  enderecoSugeridoId: z.uuid(),
});

class DefinirEnderecoSugeridoBodyDto extends createZodDto(
  DefinirEnderecoSugeridoBodySchema,
) {}

@ApiTags('Armazenagem')
@Controller('armazenagem/demandas')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class DefinirEnderecoSugeridoItemArmazenagemController {
  constructor(
    private readonly definirEnderecoSugeridoItemArmazenagemUseCase: DefinirEnderecoSugeridoItemArmazenagemUseCase,
  ) {}

  @Patch(':id/itens/:itemId/endereco-sugerido')
  @ApiOperation({
    summary: 'Define suggested storage address for item (admin)',
    operationId: 'definirEnderecoSugeridoItemArmazenagem',
  })
  @ApiSuccessResponse(ItemArmazenagemResponseDto)
  handle(
    @Param() params: DefinirEnderecoSugeridoParamsDto,
    @Body() body: DefinirEnderecoSugeridoBodyDto,
  ) {
    return this.definirEnderecoSugeridoItemArmazenagemUseCase.execute({
      demandaId: params.id,
      itemId: params.itemId,
      enderecoSugeridoId: body.enderecoSugeridoId,
    });
  }
}
