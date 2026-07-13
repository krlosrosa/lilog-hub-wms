import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PreRecebimentoResponseDto } from '../../../application/dtos/recebimento/list-recebimentos.dto.js';
import { CreatePreRecebimentoUseCase } from '../../../application/usecases/recebimento/create-pre-recebimento.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { RECEBIMENTO_PERMISSION } from '../../../shared/constants/recebimento-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

const CreatePreRecebimentoItemBodySchema = z.object({
  produtoId: z.string().min(1).max(50),
  quantidadeEsperada: z.number().positive(),
  unidadeMedida: z.string().min(1).max(20),
  loteEsperado: z.string().optional(),
  pesoEsperado: z.number().positive().optional(),
  validadeEsperada: z.iso.datetime().optional(),
});

const CreateNotaFiscalPreRecebimentoBodySchema = z.object({
  numeroNf: z.string().min(1).max(20),
  serie: z.string().max(5).optional(),
  chaveAcesso: z.string().max(44).optional(),
  numeroRemessa: z.string().max(100).optional(),
  fornecedorNome: z.string().max(255).optional(),
  fornecedorDocumento: z.string().max(20).optional(),
  pesoTotal: z.number().nonnegative().optional(),
  volumeTotal: z.number().nonnegative().optional(),
  observacao: z.string().optional(),
});

const CreatePreRecebimentoBodySchema = z.object({
  unidadeId: z.string().min(1).max(50),
  transportadoraNome: z.string().max(255).optional(),
  placa: z.string().max(20).optional(),
  numeroOcr: z.string().max(100).optional(),
  numeroTransporte: z.string().max(100).optional(),
  origemDados: z.enum(['manual', 'xlsx', 'xml', 'ocr']).default('manual'),
  origem: z.string().max(50).default('3201').optional(),
  horarioPrevisto: z.iso.datetime(),
  observacao: z.string().optional(),
  quantidadePaletesEsperada: z.number().int().nonnegative().optional(),
  itens: z.array(CreatePreRecebimentoItemBodySchema).min(1),
  notasFiscais: z.array(CreateNotaFiscalPreRecebimentoBodySchema).optional(),
});

class CreatePreRecebimentoBodyDto extends createZodDto(
  CreatePreRecebimentoBodySchema,
) {}

@ApiTags('Recebimento')
@Controller('pre-recebimentos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CreatePreRecebimentoController {
  constructor(
    private readonly createPreRecebimentoUseCase: CreatePreRecebimentoUseCase,
  ) {}

  @RequirePermissions(RECEBIMENTO_PERMISSION.CRIAR)
  @Auditable({ action: 'create', resource: 'pre-recebimento' })
  @Post()
  @ApiOperation({
    summary: 'Create pre-recebimento',
    operationId: 'createPreRecebimento',
  })
  @ApiSuccessResponse(PreRecebimentoResponseDto, 'created')
  handle(
    @Body() body: CreatePreRecebimentoBodyDto,
    @Req() request: { user?: RequestUser },
  ) {
    return this.createPreRecebimentoUseCase.execute({
      data: {
        ...body,
        horarioPrevisto: new Date(body.horarioPrevisto),
        itens: body.itens.map((item) => ({
          ...item,
          validadeEsperada: item.validadeEsperada
            ? new Date(item.validadeEsperada)
            : undefined,
        })),
      },
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
