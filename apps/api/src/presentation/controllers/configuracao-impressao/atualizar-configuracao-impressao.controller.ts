import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ConfiguracaoImpressaoResponseDto } from '../../../application/dtos/configuracao-impressao/list-configuracoes-impressao.dto.js';
import { AtualizarConfiguracaoImpressaoUseCase } from '../../../application/usecases/configuracao-impressao/atualizar-configuracao-impressao.usecase.js';
import {
  ConfiguracaoImpressaoConteudoSchema,
  TemplatesHtmlSchema,
} from '../../../domain/model/configuracao-impressao/configuracao-impressao.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { EXPEDICAO_PERMISSION } from '../../../shared/constants/expedicao-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const UpdateConfiguracaoImpressaoBodySchema = z.object({
  nome: z.string().min(1).max(120).optional(),
  configuracao: ConfiguracaoImpressaoConteudoSchema.optional(),
  templatesHtml: TemplatesHtmlSchema.optional(),
  isPadrao: z.boolean().optional(),
});

class UpdateConfiguracaoImpressaoBodyDto extends createZodDto(
  UpdateConfiguracaoImpressaoBodySchema,
) {}

@ApiTags('Expedicao')
@Controller('expedicao/configuracoes-impressao')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class AtualizarConfiguracaoImpressaoController {
  constructor(
    private readonly atualizarConfiguracaoImpressaoUseCase: AtualizarConfiguracaoImpressaoUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Auditable({ action: 'update', resource: 'configuracao_impressao' })
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar configuração de impressão',
    operationId: 'atualizarConfiguracaoImpressao',
  })
  @ApiSuccessResponse(ConfiguracaoImpressaoResponseDto)
  handle(
    @Param('id') id: string,
    @Body() body: UpdateConfiguracaoImpressaoBodyDto,
  ) {
    return this.atualizarConfiguracaoImpressaoUseCase.execute({ id, data: body });
  }
}
