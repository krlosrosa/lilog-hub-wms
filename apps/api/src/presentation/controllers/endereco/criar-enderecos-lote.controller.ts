import { BadRequestException, Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { ImportEnderecosResponseDto } from '../../../application/dtos/endereco/endereco.dto.js';
import { CriarEnderecosLoteUseCase } from '../../../application/usecases/endereco/criar-enderecos-lote.usecase.js';
import {
  CreateEnderecoBodySchema,
  CreateEnderecoInputSchema,
} from '../../../domain/model/endereco/endereco.model.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { Auditable } from '../../../shared/decorators/auditable.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { ADDRESS_PERMISSION } from '../../../shared/constants/address-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

const CriarEnderecosLoteBodySchema = z.object({
  items: z.array(CreateEnderecoBodySchema).min(1).max(5000),
});

class CriarEnderecosLoteBodyDto extends createZodDto(CriarEnderecosLoteBodySchema) {}

@ApiTags('Endereco')
@Controller('enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class CriarEnderecosLoteController {
  constructor(
    private readonly criarEnderecosLoteUseCase: CriarEnderecosLoteUseCase,
  ) {}

  @RequirePermissions(ADDRESS_PERMISSION.CREATE)
  @Auditable({ action: 'create', resource: 'endereco-lote' })
  @Post('lote')
  @ApiOperation({
    summary: 'Criar endereços em lote',
    operationId: 'criarEnderecosLote',
  })
  @ApiSuccessResponse(ImportEnderecosResponseDto, 'created')
  async handle(@Body() body: CriarEnderecosLoteBodyDto) {
    const parsedItems: ReturnType<typeof CreateEnderecoInputSchema.parse>[] = [];

    for (let index = 0; index < body.items.length; index++) {
      const item = body.items[index]!;
      const parsed = CreateEnderecoInputSchema.safeParse(item);

      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        throw new BadRequestException({
          message: issue?.message ?? 'Dados inválidos no lote',
          linha: index + 1,
          campo: issue?.path.join('.') ?? 'items',
        });
      }

      parsedItems.push(parsed.data);
    }

    return this.criarEnderecosLoteUseCase.execute(parsedItems);
  }
}
