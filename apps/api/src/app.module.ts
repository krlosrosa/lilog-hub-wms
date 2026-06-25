import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';



import { AuthModule } from './infra/modules/auth.module.js';

import { AuditLogModule } from './infra/modules/audit-log.module.js';

import { BullModuleConfig } from './infra/modules/bull.module.js';

import { CacheModuleConfig } from './infra/modules/cache.module.js';

import { MovementRecordModule } from './infra/modules/movement-record.module.js';

import { UnidadeModule } from './infra/modules/unidade.module.js';

import { EnderecoModule } from './infra/modules/endereco.module.js';

import { ProdutoEnderecoModule } from './infra/modules/produto-endereco.module.js';

import { DocaModule } from './infra/modules/doca.module.js';

import { InventarioModule } from './infra/modules/inventario.module.js';

import { ProdutoModule } from './infra/modules/produto.module.js';

import { RavexModule } from './infra/modules/ravex.module.js';

import { FuncionarioModule } from './infra/modules/funcionario.module.js';

import { UserModule } from './infra/modules/user.module.js';

import { RecebimentoModule } from './infra/modules/recebimento.module.js';

import { DocumentoModule } from './infra/modules/documento.module.js';

import { CncModule } from './infra/modules/cnc.module.js';

import { EstoqueModule } from './infra/modules/estoque.module.js';

import { ArmazenagemModule } from './infra/modules/armazenagem.module.js';

import { ExpedicaoModule } from './infra/modules/expedicao.module.js';

import { TransportadoraModule } from './infra/modules/transportadora.module.js';

import { PerfilTarifaModule } from './infra/modules/perfil-tarifa.module.js';

import { SessaoOperacaoModule } from './infra/modules/sessao-operacao.module.js';

import { OperacionalModule } from './infra/modules/operacional.module.js';

import { OpWmsModule } from './infra/modules/op-wms.module.js';

import { CorteOperacionalModule } from './infra/modules/corte-operacional.module.js';

import { DrizzleModule } from './infra/db/providers/drizzle/drizzle.module.js';



@Module({

  imports: [

    ConfigModule.forRoot({

      isGlobal: true,

      envFilePath: ['.env.local', '.env'],

    }),

    DrizzleModule,

    BullModuleConfig,

    CacheModuleConfig,

    AuthModule,

    AuditLogModule,

    MovementRecordModule,

    UnidadeModule,

    ProdutoModule,

    EnderecoModule,

    ProdutoEnderecoModule,

    DocaModule,

    RecebimentoModule,

    InventarioModule,

    FuncionarioModule,

    UserModule,

    RavexModule,

    DocumentoModule,

    CncModule,

    EstoqueModule,

    ArmazenagemModule,

    ExpedicaoModule,

    TransportadoraModule,

    PerfilTarifaModule,

    SessaoOperacaoModule,

    OperacionalModule,

    OpWmsModule,

    CorteOperacionalModule,

  ],

})

export class AppModule {}

