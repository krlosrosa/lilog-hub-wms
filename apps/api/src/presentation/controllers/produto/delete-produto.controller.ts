import { Controller, Delete, HttpCode, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { DeleteProdutoUseCase } from '../../../application/usecases/produto/delete-produto.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Produto')
@Controller('produtos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class DeleteProdutoController {
  constructor(private readonly deleteProdutoUseCase: DeleteProdutoUseCase) {}

  @Auditable({ action: 'delete', resource: 'produto', capturePayload: false })
  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete produto',
    operationId: 'deleteProduto',
  })
  async handle(@Param('id') id: string) {
    await this.deleteProdutoUseCase.execute(id);
  }
}
