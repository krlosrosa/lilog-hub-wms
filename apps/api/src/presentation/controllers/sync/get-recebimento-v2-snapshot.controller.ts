import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { GetRecebimentoV2SnapshotUseCase } from '../../../application/usecases/sync/get-recebimento-v2-snapshot.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';
import {
  getRequestUser,
  type RequestUser,
} from '../../../shared/utils/request-user.js';

const GetRecebimentoV2SnapshotResponseSchema = z.object({
  processId: z.string(),
  revision: z.number().int().nonnegative(),
  situacao: z.string(),
  conferencias: z.array(z.unknown()),
  avarias: z.array(z.unknown()),
  checklist: z
    .object({
      id: z.string(),
      recebimentoId: z.string(),
      lacre: z.string().nullable(),
      tempBau: z.number().nullable(),
      tempProduto: z.number().nullable(),
      conditions: z.object({
        limpeza: z.boolean(),
        odor: z.boolean(),
        estrutura: z.boolean(),
        vedacao: z.boolean(),
      }),
      observacoes: z.string().nullable(),
      photoCount: z.number().int().nonnegative(),
      createdAt: z.string(),
      docaId: z.string().nullable(),
    })
    .nullable(),
  encerradoEm: z.string().nullable(),
});

class GetRecebimentoV2SnapshotResponseDto extends createZodDto(
  GetRecebimentoV2SnapshotResponseSchema,
) {}

@ApiTags('Sync')
@Controller('sync')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class GetRecebimentoV2SnapshotController {
  constructor(
    private readonly getRecebimentoV2SnapshotUseCase: GetRecebimentoV2SnapshotUseCase,
  ) {}

  @Get('adapters/recebimento-v2/processes/:id/snapshot')
  @ApiOperation({
    summary: 'Retorna snapshot atual de um processo para reconciliação',
    operationId: 'getRecebimentoV2Snapshot',
  })
  @ApiSuccessResponse(GetRecebimentoV2SnapshotResponseDto, 'ok')
  handle(
    @Param('id') id: string,
    @Req() request: { user?: RequestUser },
  ) {
    return this.getRecebimentoV2SnapshotUseCase.execute({
      processId: id,
      userId: getRequestUser(request)?.id ?? null,
    });
  }
}
