import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './config/migrations/schema.js';

export const DRIZZLE_PROVIDER = 'DRIZZLE_PROVIDER';

export type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

export type DrizzleTransaction = Parameters<
  Parameters<DrizzleClient['transaction']>[0]
>[0];

export type DrizzleExecutor = DrizzleClient | DrizzleTransaction;

export function createDrizzleClient(
  configService: ConfigService,
): DrizzleClient {
  const connectionString = configService.getOrThrow<string>('DATABASE_URL');
  const client = postgres(connectionString, { max: 10 });
  return drizzle(client, { schema });
}

export const drizzleProvider = {
  provide: DRIZZLE_PROVIDER,
  useFactory: (configService: ConfigService) =>
    createDrizzleClient(configService),
  inject: [ConfigService],
};
