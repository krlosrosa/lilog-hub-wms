import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import {
  DrizzleShutdownService,
  drizzleProvider,
  postgresClientProvider,
} from './drizzle.provider.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [postgresClientProvider, drizzleProvider, DrizzleShutdownService],
  exports: [drizzleProvider, postgresClientProvider],
})
export class DrizzleModule {}
