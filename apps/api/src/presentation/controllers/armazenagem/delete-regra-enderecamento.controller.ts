import {
  Controller,
  Delete,
  HttpCode,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeleteRegraEnderecamentoUseCase } from '../../../application/usecases/armazenagem/delete-regra-enderecamento.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Armazenagem')
@Controller('armazenagem/regras-enderecamento')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeleteRegraEnderecamentoController {
  constructor(
    private readonly deleteRegraEnderecamentoUseCase: DeleteRegraEnderecamentoUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete storage addressing rule',
    operationId: 'deleteRegraEnderecamento',
  })
  async handle(@Param('id') id: string) {
    await this.deleteRegraEnderecamentoUseCase.execute(id);
  }
}
