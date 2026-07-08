import {
  Body,
  Controller,
  Param,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';

import { ImprimirEtiquetasRecebimentoBodyDto } from '../../../application/dtos/recebimento/etiqueta-armazenagem.dto.js';
import { ImprimirEtiquetasRecebimentoUseCase } from '../../../application/usecases/recebimento/imprimir-etiquetas-recebimento.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ImprimirEtiquetasRecebimentoController {
  constructor(
    private readonly imprimirEtiquetasRecebimentoUseCase: ImprimirEtiquetasRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.FINALIZAR)
  @Post(':id/etiquetas/imprimir')
  @ApiOperation({
    summary: 'Gerar PDF de etiquetas de palete do recebimento',
    operationId: 'imprimirEtiquetasRecebimento',
  })
  @ApiProduces('application/pdf')
  async handle(
    @Param('id') id: string,
    @Body() body: ImprimirEtiquetasRecebimentoBodyDto,
  ) {
    const result = await this.imprimirEtiquetasRecebimentoUseCase.execute({
      recebimentoId: id,
      etiquetas: body.etiquetas,
    });

    return new StreamableFile(result.buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${result.filename}"`,
    });
  }
}
