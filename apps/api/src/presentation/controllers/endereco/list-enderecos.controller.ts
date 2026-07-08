import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  EnderecoKpiResponseDto,
  ListEnderecosQueryDto,
  ListEnderecosResponseDto,
} from '../../../application/dtos/endereco/endereco.dto.js';
import {
  GetEnderecoKpiUseCase,
  ListEnderecosUseCase,
} from '../../../application/usecases/endereco/list-enderecos.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { RequirePermissions } from '../../../shared/decorators/require-permissions.decorator.js';
import { ADDRESS_PERMISSION } from '../../../shared/constants/address-permissions.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../../../shared/guards/permissions.guard.js';

@ApiTags('Endereco')
@Controller('enderecos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('access-token')
@ApiErrorResponses()
export class ListEnderecosController {
  constructor(
    private readonly listEnderecosUseCase: ListEnderecosUseCase,
    private readonly getEnderecoKpiUseCase: GetEnderecoKpiUseCase,
  ) {}

  @RequirePermissions(ADDRESS_PERMISSION.VIEW)
  @Get()
  @ApiOperation({
    summary: 'List enderecos',
    operationId: 'listEnderecos',
  })
  @ApiSuccessResponse(ListEnderecosResponseDto)
  handle(@Query() query: ListEnderecosQueryDto) {
    return this.listEnderecosUseCase.execute(query);
  }

  @RequirePermissions(ADDRESS_PERMISSION.CAPACITY_VIEW)
  @Get('kpi')
  @ApiOperation({
    summary: 'Get enderecos KPI',
    operationId: 'getEnderecoKpi',
  })
  @ApiSuccessResponse(EnderecoKpiResponseDto)
  getKpi(@Query('unidadeId') unidadeId?: string) {
    return this.getEnderecoKpiUseCase.execute({ unidadeId });
  }
}
