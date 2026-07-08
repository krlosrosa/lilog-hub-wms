import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { BuscarProcessoDebitoPortalUseCase } from '../../application/usecases/portal/buscar-processo-debito-portal.usecase.js';
import { GetMePortalUseCase } from '../../application/usecases/portal/get-me-portal.usecase.js';
import { ListarNotificacoesPortalUseCase } from '../../application/usecases/portal/listar-notificacoes-portal.usecase.js';
import { ListarProcessosDebitoPortalUseCase } from '../../application/usecases/portal/listar-processos-debito-portal.usecase.js';
import { MarcarNotificacoesLidasPortalUseCase } from '../../application/usecases/portal/marcar-notificacoes-lidas-portal.usecase.js';
import { RegistrarInteracaoPortalUseCase } from '../../application/usecases/portal/registrar-interacao-portal.usecase.js';
import { SolicitarCodigoPortalUseCase } from '../../application/usecases/portal/solicitar-codigo-portal.usecase.js';
import { UploadReplicaAnexoPortalUseCase } from '../../application/usecases/portal/upload-replica-anexo-portal.usecase.js';
import { VerificarCodigoPortalUseCase } from '../../application/usecases/portal/verificar-codigo-portal.usecase.js';
import { BuscarProcessoDebitoPortalController } from '../../presentation/controllers/portal/buscar-processo-debito-portal.controller.js';
import { ListarNotificacoesPortalController } from '../../presentation/controllers/portal/listar-notificacoes-portal.controller.js';
import { ListarProcessosDebitoPortalController } from '../../presentation/controllers/portal/listar-processos-debito-portal.controller.js';
import { LogoutPortalController } from '../../presentation/controllers/portal/logout-portal.controller.js';
import { MarcarNotificacoesLidasPortalController } from '../../presentation/controllers/portal/marcar-notificacoes-lidas-portal.controller.js';
import { MePortalController } from '../../presentation/controllers/portal/me-portal.controller.js';
import { RegistrarInteracaoPortalController } from '../../presentation/controllers/portal/registrar-interacao-portal.controller.js';
import { SolicitarCodigoPortalController } from '../../presentation/controllers/portal/solicitar-codigo-portal.controller.js';
import { UploadReplicaAnexoPortalController } from '../../presentation/controllers/portal/upload-replica-anexo-portal.controller.js';
import { VerificarCodigoPortalController } from '../../presentation/controllers/portal/verificar-codigo-portal.controller.js';
import { PortalJwtAuthGuard } from '../../shared/guards/portal-jwt-auth.guard.js';
import { PortalJwtStrategy } from '../../shared/strategies/portal-jwt.strategy.js';
import { CobrancaTransportadoraModule } from './cobranca-transportadora.module.js';
import { DocumentoModule } from './documento.module.js';
import { TransportadoraModule } from './transportadora.module.js';

@Module({
  imports: [
    TransportadoraModule,
    CobrancaTransportadoraModule,
    DocumentoModule,
    PassportModule.register({ defaultStrategy: 'portal-jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [
    SolicitarCodigoPortalController,
    VerificarCodigoPortalController,
    LogoutPortalController,
    MePortalController,
    ListarProcessosDebitoPortalController,
    BuscarProcessoDebitoPortalController,
    RegistrarInteracaoPortalController,
    UploadReplicaAnexoPortalController,
    ListarNotificacoesPortalController,
    MarcarNotificacoesLidasPortalController,
  ],
  providers: [
    PortalJwtStrategy,
    PortalJwtAuthGuard,
    SolicitarCodigoPortalUseCase,
    VerificarCodigoPortalUseCase,
    GetMePortalUseCase,
    ListarProcessosDebitoPortalUseCase,
    BuscarProcessoDebitoPortalUseCase,
    RegistrarInteracaoPortalUseCase,
    UploadReplicaAnexoPortalUseCase,
    ListarNotificacoesPortalUseCase,
    MarcarNotificacoesLidasPortalUseCase,
  ],
  exports: [JwtModule, PassportModule, PortalJwtStrategy],
})
export class PortalModule {}
