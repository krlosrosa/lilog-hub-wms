import { Controller, Get, Param } from '@nestjs/common';

import { ApiOperation, ApiTags } from '@nestjs/swagger';



import { ListDemandaEnderecosUseCase } from '../../../application/usecases/inventario/contagem.usecases.js';

import {

  ApiErrorResponses,

  ApiSuccessResponse,

} from '../../../shared/decorators/api-responses.decorator.js';



@ApiTags('Contagem')

@Controller('estoque/contagem')

@ApiErrorResponses()

export class ListDemandaEnderecosController {

  constructor(

    private readonly listDemandaEnderecosUseCase: ListDemandaEnderecosUseCase,

  ) {}



  @Get('demands/:id/enderecos')

  @ApiOperation({

    summary: 'List enderecos for demanda',

    operationId: 'listDemandaEnderecos',

  })

  @ApiSuccessResponse(Object)

  async handle(@Param('id') demandaId: string) {

    const items = await this.listDemandaEnderecosUseCase.execute(demandaId);

    return items.map((item) => ({

      id: item.id,

      endereco: item.enderecoMascarado,

      status: item.status,

      sequence: item.sequence,

    }));

  }

}

