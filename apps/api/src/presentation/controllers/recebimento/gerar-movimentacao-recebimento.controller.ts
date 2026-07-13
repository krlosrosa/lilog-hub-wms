import { Body, Controller, Post, StreamableFile, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { GerarMovimentacaoRecebimentoUseCase } from '../../../application/usecases/recebimento/gerar-movimentacao-recebimento.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const CentroEmpresaSchema = z.string().length(4);

const GerarMovimentacaoBodySchema = z.object({
  preRecebimentoIds: z.array(z.uuid()).min(1),
  centrosPorEmpresa: z.object({
    LDB: CentroEmpresaSchema.optional(),
    ITB: CentroEmpresaSchema.optional(),
    DPA: CentroEmpresaSchema.optional(),
  }),
});

class GerarMovimentacaoBodyDto extends createZodDto(
  GerarMovimentacaoBodySchema,
) {}

@ApiTags('Recebimento')
@Controller('recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GerarMovimentacaoRecebimentoController {
  constructor(
    private readonly gerarMovimentacaoRecebimentoUseCase: GerarMovimentacaoRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.VISUALIZAR)
  @Post('movimentacao/export')
  @ApiOperation({
    summary: 'Gerar planilha de movimentação MIGO para recebimentos conferidos',
    operationId: 'gerarMovimentacaoRecebimento',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async handle(@Body() body: GerarMovimentacaoBodyDto) {
    const result = await this.gerarMovimentacaoRecebimentoUseCase.execute({
      preRecebimentoIds: body.preRecebimentoIds,
      centrosPorEmpresa: body.centrosPorEmpresa,
    });

    return new StreamableFile(result.buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${result.filename}"`,
    });
  }
}
