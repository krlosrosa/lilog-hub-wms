import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ListAuditLogsQueryDto,
  ListAuditLogsResponseDto,
} from '../../../application/dtos/audit-log/list-audit-logs.dto.js';
import { ListAuditLogsUseCase } from '../../../application/usecases/audit-log/list-audit-logs.usecase.js';
import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard.js';

@ApiTags('Audit Log')
@Controller('audit-logs')
@ApiErrorResponses()
@UseGuards(JwtAuthGuard)
export class ListAuditLogsController {
  constructor(private readonly listAuditLogsUseCase: ListAuditLogsUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'List audit logs',
    operationId: 'listAuditLogs',
  })
  @ApiSuccessResponse(ListAuditLogsResponseDto)
  handle(@Query() query: ListAuditLogsQueryDto) {
    return this.listAuditLogsUseCase.execute(query);
  }
}
