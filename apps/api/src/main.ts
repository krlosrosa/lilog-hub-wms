import 'reflect-metadata';

import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compress from '@fastify/compress';
import fastifyCookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import { cleanupOpenApiDoc, ZodValidationPipe } from 'nestjs-zod';

import { AppModule } from './app.module.js';
import { AuditInterceptor } from './shared/interceptors/audit.interceptor.js';

const DEV_CORS_PORTS = new Set(['3000', '5174', '5175', '5176', '4173', '4175']);

function isDevCorsOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (!DEV_CORS_PORTS.has(url.port)) {
      return false;
    }

    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return true;
    }

    return (
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(url.hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(url.hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(url.hostname)
    );
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'queues', method: RequestMethod.ALL },
      { path: 'queues/(.*)', method: RequestMethod.ALL },
    ],
  });

  await app.register(compress, { encodings: ['gzip', 'br'] });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(fastifyCookie);
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  const fastify = app.getHttpAdapter().getInstance();
  fastify.addContentTypeParser(
    /^image\/.*/,
    { parseAs: 'buffer' },
    (_request, body, done) => {
      done(null, body);
    },
  );

  const rawOrigins = configService.get<string>(
    'CORS_ORIGIN',
    'http://localhost:3000,http://localhost:5174,http://localhost:5175',
  );
  const allowedOrigins = rawOrigins.split(',').map((o) => o.trim());
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const isDevelopment = nodeEnv !== 'production';

  if (!isDevelopment) {
    const jwtService = app.get(JwtService);

    fastify.addHook('onRequest', async (request, reply) => {
      if (!request.url.startsWith('/queues')) {
        return;
      }

      const cookies = request.cookies as Record<string, string> | undefined;
      const bearer = request.headers.authorization?.replace(/^Bearer\s+/i, '');
      const token = cookies?.access_token ?? bearer;

      if (!token) {
        reply.code(401).send({ message: 'Unauthorized' });
        return;
      }

      try {
        const payload = await jwtService.verifyAsync<{ role?: string }>(token);

        if (payload.role !== 'admin') {
          reply.code(403).send({ message: 'Forbidden' });
        }
      } catch {
        reply.code(401).send({ message: 'Unauthorized' });
      }
    });
  }

  app.enableCors({
    origin: (origin, cb) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (isDevelopment && isDevCorsOrigin(origin))
      ) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-unidade-id'],
  });
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(app.get(AuditInterceptor));

  if (isDevelopment) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Lilog Hub API')
      .setDescription(
        'API do Sistema Logístico Lilog Hub — estoque, expedição, transporte e operações de centro de distribuição.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          in: 'header',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document), {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port, '0.0.0.0');

  console.log(`API running on http://localhost:${port}/api`);
  if (isDevelopment) {
    console.log(`Swagger docs at http://localhost:${port}/api/docs`);
  }
  console.log(`Bull Board at http://localhost:${port}/queues`);
}

bootstrap();
