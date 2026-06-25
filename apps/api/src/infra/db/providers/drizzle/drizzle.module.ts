import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { drizzleProvider } from './drizzle.provider.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [drizzleProvider],
  exports: [drizzleProvider],
})
export class DrizzleModule {}
