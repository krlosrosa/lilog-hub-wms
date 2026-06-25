import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';



import { RecebimentoResponseDto } from '../../../application/dtos/recebimento/list-recebimentos.dto.js';

import { GetRecebimentoByPreRecebimentoUseCase } from '../../../application/usecases/recebimento/get-recebimento-by-pre-recebimento.usecase.js';

import {

  ApiErrorResponses,

  ApiSuccessResponse,

} from '../../../shared/decorators/api-responses.decorator.js';

import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';

import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';

import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';



@ApiTags('Recebimento')

@Controller('pre-recebimentos')

@UseGuards(JwtAuthGuard, PermissionsGuard)

@ApiBearerAuth('access-token')

@ApiErrorResponses()

export class GetRecebimentoByPreRecebimentoController {

  constructor(

    private readonly getRecebimentoByPreRecebimentoUseCase: GetRecebimentoByPreRecebimentoUseCase,

  ) {}



  @RequirePermissions(RECEBIMENTO_PERMISSION.VISUALIZAR)

  @Get(':id/recebimento')

  @ApiOperation({

    summary: 'Get recebimento by pre-recebimento id',

    operationId: 'getRecebimentoByPreRecebimento',

  })

  @ApiSuccessResponse(RecebimentoResponseDto)

  handle(@Param('id') id: string) {

    return this.getRecebimentoByPreRecebimentoUseCase.execute(id);

  }

}


