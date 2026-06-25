import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ConfiguracaoImpressaoResponseDto } from '../../../application/dtos/configuracao-impressao/list-configuracoes-impressao.dto.js';
import { CriarConfiguracaoImpressaoUseCase } from '../../../application/usecases/configuracao-impressao/criar-configuracao-impressao.usecase.js';
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

const CreateConfiguracaoImpressaoBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  nome: z.string().min(1).max(120),
  configuracao: ConfiguracaoImpressaoConteudoSchema,
  templatesHtml: TemplatesHtmlSchema,
  isPadrao: z.boolean().optional().default(false),
});

class CreateConfiguracaoImpressaoBodyDto extends createZodDto(
  CreateConfiguracaoImpressaoBodySchema,
) {}

@ApiTags('Expedicao')
@Controller('expedicao/configuracoes-impressao')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CriarConfiguracaoImpressaoController {
  constructor(
    private readonly criarConfiguracaoImpressaoUseCase: CriarConfiguracaoImpressaoUseCase,
  ) {}

  @RequirePermissions(EXPEDICAO_PERMISSION.UPLOAD)
  @Auditable({ action: 'create', resource: 'configuracao_impressao' })
  @Post()
  @ApiOperation({
    summary: 'Criar configuração de impressão',
    operationId: 'criarConfiguracaoImpressao',
  })
  @ApiSuccessResponse(ConfiguracaoImpressaoResponseDto, 'created')
  handle(@Body() body: CreateConfiguracaoImpressaoBodyDto) {
    return this.criarConfiguracaoImpressaoUseCase.execute(body);
  }
}
