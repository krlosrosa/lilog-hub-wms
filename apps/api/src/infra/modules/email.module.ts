import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { emailProvider } from '../clients/email/email.provider.js';
import { EMAIL_PROVIDER } from '../clients/email/email.types.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [emailProvider],
  exports: [EMAIL_PROVIDER],
})
export class EmailModule {}
