import { InjectQueue } from '@nestjs/bullmq';
import {
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import type { Queue } from 'bullmq';
import { Observable, tap } from 'rxjs';

import {
  AUDIT_LOG_QUEUE,
  JOB_REGISTRAR_AUDIT,
  type RegistrarAuditJobData,
} from '../../infra/queues/audit-log.queue.js';
import {
  AUDITABLE_KEY,
  type AuditableMetadata,
} from '../decorators/auditable.decorator.js';
import { getAuditBefore } from '../utils/audit-context.js';

type AuthenticatedUser = {
  id: number;
  email: string;
};

type AuditableRequest = {
  method: string;
  url: string;
  ip?: string;
  body?: unknown;
  params?: Record<string, string | undefined>;
  query?: unknown;
  user?: AuthenticatedUser;
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    @InjectQueue(AUDIT_LOG_QUEUE)
    private readonly auditQueue: Queue,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditable = this.reflector.get<AuditableMetadata | undefined>(
      AUDITABLE_KEY,
      context.getHandler(),
    );

    if (!auditable) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<AuditableRequest>();
    const response = context.switchToHttp().getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      tap({
        next: (body) => {
          void this.enqueueAudit(
            auditable,
            request,
            response.statusCode,
            body,
          );
        },
        error: (error: unknown) => {
          const status =
            error instanceof HttpException ? error.getStatus() : 500;

          void this.enqueueAudit(auditable, request, status, null);
        },
      }),
    );
  }

  private resolveUser(
    request: AuditableRequest,
    responseBody: unknown,
  ): AuthenticatedUser | null {
    if (request.user) {
      return request.user;
    }

    return this.extractUserFromResponse(responseBody);
  }

  private extractUserFromResponse(
    responseBody: unknown,
  ): AuthenticatedUser | null {
    if (!responseBody || typeof responseBody !== 'object') {
      return null;
    }

    const record = responseBody as Record<string, unknown>;
    const user = record.user;

    if (!user || typeof user !== 'object') {
      return null;
    }

    const userRecord = user as Record<string, unknown>;

    if (
      typeof userRecord.id === 'number' &&
      typeof userRecord.email === 'string'
    ) {
      return {
        id: userRecord.id,
        email: userRecord.email,
      };
    }

    return null;
  }

  private async enqueueAudit(
    auditable: AuditableMetadata,
    request: AuditableRequest,
    httpStatus: number,
    responseBody: unknown,
  ): Promise<void> {
    try {
      const user = this.resolveUser(request, responseBody);
      const params = request.params ?? {};
      const resourceId =
        this.extractResourceId(responseBody) ??
        params.id ??
        params.itemId ??
        null;

      const jobData: RegistrarAuditJobData = {
        userId: user?.id ?? null,
        userEmail: user?.email ?? null,
        action: auditable.action,
        resource: auditable.resource,
        resourceId,
        httpMethod: request.method,
        httpPath: request.url,
        httpStatus,
        payload: auditable.capturePayload
          ? {
              before: getAuditBefore(request),
              after:
                auditable.captureResponse !== false
                  ? this.sanitizePayload(responseBody)
                  : null,
            }
          : null,
        metadata: {
          params: request.params,
          query: request.query,
        },
        ipAddress: request.ip ?? null,
      };

      await this.auditQueue.add(JOB_REGISTRAR_AUDIT, jobData, {
        jobId: `${auditable.resource}-${auditable.action}-${Date.now()}-${user?.id ?? 'anonymous'}`,
      });
    } catch (error) {
      this.logger.error('Failed to enqueue audit log job', error);
    }
  }

  private extractResourceId(responseBody: unknown): string | null {
    if (!responseBody || typeof responseBody !== 'object') {
      return null;
    }

    const record = responseBody as Record<string, unknown>;

    if (typeof record.id === 'string') {
      return record.id;
    }

    return null;
  }

  private sanitizePayload(body: unknown): Record<string, unknown> | null {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return null;
    }

    return body as Record<string, unknown>;
  }
}
