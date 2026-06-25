import { applyDecorators } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

type ApiSuccessAction = 'ok' | 'created';

export function ApiErrorResponses() {
  return applyDecorators(
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiResponse({ status: 404, description: 'Not Found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
}

export function ApiSuccessResponse(
  dto: Type<unknown>,
  action: ApiSuccessAction = 'ok',
) {
  return applyDecorators(
    ApiResponse({
      status: action === 'created' ? 201 : 200,
      type: dto,
    }),
  );
}
