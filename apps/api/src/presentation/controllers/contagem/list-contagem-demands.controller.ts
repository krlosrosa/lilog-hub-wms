import { Controller, Get } from '@nestjs/common';

import { ApiOperation, ApiTags } from '@nestjs/swagger';



import { toPwaInventoryDemand } from '../../../application/dtos/inventario/inventario.dto.js';

import { ListContagemDemandsUseCase } from '../../../application/usecases/inventario/contagem.usecases.js';

import {

  ApiErrorResponses,

  ApiSuccessResponse,

} from '../../../shared/decorators/api-responses.decorator.js';



@ApiTags('Contagem')

@Controller('estoque/contagem')

@ApiErrorResponses()

export class ListContagemDemandsController {

  constructor(

    private readonly listContagemDemandsUseCase: ListContagemDemandsUseCase,

  ) {}



  @Get('demands')

  @ApiOperation({

    summary: 'List inventory demands for operator',

    operationId: 'listContagemDemands',

  })

  @ApiSuccessResponse(Object)

  async handle() {

    const items = await this.listContagemDemandsUseCase.execute();

    return items.map(toPwaInventoryDemand);

  }

}

