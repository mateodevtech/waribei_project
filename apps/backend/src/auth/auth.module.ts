import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          // Number(...) : conversion RUNTIME explicite. configService.get<number>(...) ne
          // suffit pas -> process.env (donc ConfigService) ne contient QUE des strings,
          // le generic <number> est une indication TypeScript, pas une conversion réelle.
          // Sans ce Number(), on enverrait la string "86400" en croyant avoir un vrai number.
          expiresIn: Number(configService.get<string>('JWT_EXPIRES_IN_SECONDS')),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
