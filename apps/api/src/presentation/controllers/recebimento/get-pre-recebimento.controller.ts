import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';



import { PreRecebimentoResponseDto } from '../../../application/dtos/recebimento/list-recebimentos.dto.js';

import { GetPreRecebimentoUseCase } from '../../../application/usecases/recebimento/get-pre-recebimento.usecase.js';

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

export class GetPreRecebimentoController {

  constructor(

    private readonly getPreRecebimentoUseCase: GetPreRecebimentoUseCase,

  ) {}



  @RequirePermissions(RECEBIMENTO_PERMISSION.VISUALIZAR)

  @Get(':id')

  @ApiOperation({

    summary: 'Get pre-recebimento by id',

    operationId: 'getPreRecebimento',

  })

  @ApiSuccessResponse(PreRecebimentoResponseDto)

  handle(@Param('id') id: string) {

    return this.getPreRecebimentoUseCase.execute(id);

  }

}


