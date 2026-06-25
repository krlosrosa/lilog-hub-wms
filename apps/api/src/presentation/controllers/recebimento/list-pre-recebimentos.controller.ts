import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';



import {

  ListPreRecebimentosQueryDto,

  ListPreRecebimentosResponseDto,

} from '../../../application/dtos/recebimento/list-pre-recebimentos.dto.js';

import { ListPreRecebimentosUseCase } from '../../../application/usecases/recebimento/list-pre-recebimentos.usecase.js';

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

export class ListPreRecebimentosController {

  constructor(

    private readonly listPreRecebimentosUseCase: ListPreRecebimentosUseCase,

  ) {}



  @RequirePermissions(RECEBIMENTO_PERMISSION.VISUALIZAR)

  @Get()

  @ApiOperation({

    summary: 'List pre-recebimentos',

    operationId: 'listPreRecebimentos',

  })

  @ApiSuccessResponse(ListPreRecebimentosResponseDto)

  handle(@Query() query: ListPreRecebimentosQueryDto) {

    return this.listPreRecebimentosUseCase.execute({

      ...query,

      dataInicio: query.dataInicio ? new Date(query.dataInicio) : undefined,

      dataFim: query.dataFim ? new Date(query.dataFim) : undefined,

    });

  }

}


