import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { CentroOrigemResponseDto } from '../../../application/dtos/centro-origem/centro-origem.dto.js';
import { CreateCentroOrigemUseCase } from '../../../application/usecases/centro-origem/create-centro-origem.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

const CreateCentroOrigemBodySchema = z.object({
  centro: z.string().min(1).max(50),
  nome: z.string().min(1).max(255),
});

class CreateCentroOrigemBodyDto extends createZodDto(
  CreateCentroOrigemBodySchema,
) {}

@ApiTags('Centro de Origem')
@Controller('centros-origem')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreateCentroOrigemController {
  constructor(
    private readonly createCentroOrigemUseCase: CreateCentroOrigemUseCase,
  ) {}

  @Auditable({ action: 'create', resource: 'centro_origem' })
  @Post()
  @ApiOperation({
    summary: 'Create centro de origem',
    operationId: 'createCentroOrigem',
  })
  @ApiSuccessResponse(CentroOrigemResponseDto, 'created')
  handle(@Body() body: CreateCentroOrigemBodyDto) {
    return this.createCentroOrigemUseCase.execute(body);
  }
}
