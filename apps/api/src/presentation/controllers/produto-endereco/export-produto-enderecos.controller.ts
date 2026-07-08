import {
  Controller,
  Get,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';

import { ExportProdutoEnderecosQueryDto } from '../../../application/dtos/produto-endereco/produto-endereco.dto.js';
import { ExportProdutoEnderecosUseCase } from '../../../application/usecases/produto-endereco/export-produto-enderecos.usecase.js';
import { ApiErrorResponses } from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { ADDRESS_PERMISSION } from '../../../shared/constants/address-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('ProdutoEndereco')
@Controller('produto-enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ExportProdutoEnderecosController {
  constructor(
    private readonly exportProdutoEnderecosUseCase: ExportProdutoEnderecosUseCase,
  ) {}

  @RequirePermissions(ADDRESS_PERMISSION.VIEW)
  @Get('export')
  @ApiOperation({
    summary: 'Exportar posições de slotting para Excel',
    operationId: 'exportProdutoEnderecos',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async handle(@Query() query: ExportProdutoEnderecosQueryDto) {
    const result = await this.exportProdutoEnderecosUseCase.execute(query);

    return new StreamableFile(result.buffer, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: `attachment; filename="${result.filename}"`,
    });
  }
}
