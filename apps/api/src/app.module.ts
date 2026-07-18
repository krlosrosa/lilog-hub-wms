import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';

import { AuthModule } from './infra/modules/auth.module.js';
import { AuditLogModule } from './infra/modules/audit-log.module.js';
import { BullModuleConfig } from './infra/modules/bull.module.js';
import { CacheModuleConfig } from './infra/modules/cache.module.js';
import { UnidadeModule } from './infra/modules/unidade.module.js';
import { CentroOrigemModule } from './infra/modules/centro-origem.module.js';
import { DocaModule } from './infra/modules/doca.module.js';
import { ProdutoModule } from './infra/modules/produto.module.js';
import { RavexModule } from './infra/modules/ravex.module.js';
import { FuncionarioModule } from './infra/modules/funcionario.module.js';
import { UserModule } from './infra/modules/user.module.js';
import { RecebimentoModule } from './infra/modules/recebimento.module.js';
import { DocumentoModule } from './infra/modules/documento.module.js';
import { CncModule } from './infra/modules/cnc.module.js';
import { SessaoOperacaoModule } from './infra/modules/sessao-operacao.module.js';
import { OperacionalModule } from './infra/modules/operacional.module.js';
import { SyncModule } from './infra/modules/sync.module.js';
import { PwaSyncModule } from './infra/modules/pwa-sync.module.js';
import { DrizzleModule } from './infra/db/providers/drizzle/drizzle.module.js';
import { EmailModule } from './infra/modules/email.module.js';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    DrizzleModule,
    EmailModule,
    BullModuleConfig,
    CacheModuleConfig,
    AuthModule,
    AuditLogModule,
    UnidadeModule,
    CentroOrigemModule,
    ProdutoModule,
    DocaModule,
    RecebimentoModule,
    FuncionarioModule,
    UserModule,
    RavexModule,
    DocumentoModule,
    CncModule,
    SessaoOperacaoModule,
    OperacionalModule,
    SyncModule,
    PwaSyncModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
