import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ApiErrorResponses,
  ApiSuccessResponse,
} from '../../../shared/decorators/api-responses.decorator.js';
import {
  DRIZZLE_PROVIDER,
  type DrizzleClient,
} from '../../../infra/db/providers/drizzle/drizzle.provider.js';
import { listOperatorsDb } from '../../../infra/db/user/list-operators.drizzle.js';

@ApiTags('User')
@Controller('users')
@ApiErrorResponses()
export class ListOperatorsController {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleClient,
  ) {}

  @Get('operators')
  @ApiOperation({
    summary: 'List operators for assignment',
    operationId: 'listOperators',
  })
  @ApiSuccessResponse(Object)
  handle() {
    return listOperatorsDb(this.db);
  }
}
