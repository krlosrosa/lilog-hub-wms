import {
  Inject,
  Injectable,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './config/migrations/schema.js';

export const DRIZZLE_PROVIDER = 'DRIZZLE_PROVIDER';
export const POSTGRES_CLIENT = 'POSTGRES_CLIENT';

export type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

export type DrizzleTransaction = Parameters<
  Parameters<DrizzleClient['transaction']>[0]
>[0];

export type DrizzleExecutor = DrizzleClient | DrizzleTransaction;

export function createPostgresClient(
  configService: ConfigService,
): postgres.Sql {
  const connectionString = configService.getOrThrow<string>('DATABASE_URL');
  const max = Number.parseInt(configService.get<string>('DB_POOL_MAX', '10'), 10);

  return postgres(connectionString, {
    max: Number.isFinite(max) && max > 0 ? max : 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

export function createDrizzleClient(
  configService: ConfigService,
): DrizzleClient {
  return drizzle(createPostgresClient(configService), { schema });
}

export const postgresClientProvider = {
  provide: POSTGRES_CLIENT,
  useFactory: (configService: ConfigService) =>
    createPostgresClient(configService),
  inject: [ConfigService],
};

export const drizzleProvider = {
  provide: DRIZZLE_PROVIDER,
  useFactory: (client: postgres.Sql) => drizzle(client, { schema }),
  inject: [POSTGRES_CLIENT],
};

@Injectable()
export class DrizzleShutdownService implements OnModuleDestroy {
  constructor(
    @Inject(POSTGRES_CLIENT)
    private readonly postgresClient: postgres.Sql,
  ) {}

  async onModuleDestroy() {
    await this.postgresClient.end({ timeout: 5 });
  }
}
