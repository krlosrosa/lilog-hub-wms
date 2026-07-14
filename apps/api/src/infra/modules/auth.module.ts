import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { ChangeOwnPasswordUseCase } from '../../application/usecases/auth/change-own-password.usecase.js';
import { GetMeUseCase } from '../../application/usecases/auth/get-me.usecase.js';
import { ListMyUnidadesUseCase } from '../../application/usecases/auth/list-my-unidades.usecase.js';
import { LoginUseCase } from '../../application/usecases/auth/login.usecase.js';
import { UserService } from '../db/user/user.service.js';
import { ChangePasswordController } from '../../presentation/controllers/auth/change-password.controller.js';
import { LoginController } from '../../presentation/controllers/auth/login.controller.js';
import { LogoutController } from '../../presentation/controllers/auth/logout.controller.js';
import { ListMyUnidadesController } from '../../presentation/controllers/auth/list-my-unidades.controller.js';
import { MeController } from '../../presentation/controllers/auth/me.controller.js';
import { OptionalJwtAuthGuard } from '../../shared/guards/optional-jwt-auth.guard.js';
import { LiderancaGuard } from '../../shared/guards/lideranca.guard.js';
import { JwtStrategy } from '../../shared/strategies/jwt.strategy.js';
import { USER_REPOSITORY } from '../../domain/repositories/user/user.repository.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
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
    LoginController,
    ChangePasswordController,
    LogoutController,
    MeController,
    ListMyUnidadesController,
  ],
  providers: [
    JwtStrategy,
    OptionalJwtAuthGuard,
    LiderancaGuard,
    LoginUseCase,
    ChangeOwnPasswordUseCase,
    GetMeUseCase,
    ListMyUnidadesUseCase,
    { provide: USER_REPOSITORY, useClass: UserService },
  ],
  exports: [JwtModule, PassportModule, JwtStrategy, USER_REPOSITORY],
})
export class AuthModule {}
