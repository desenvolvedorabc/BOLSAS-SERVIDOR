import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { JwtStrategy } from './strategy/jwt.strategy';
import { AuthService } from './service/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './controller/auth.controller';
import { User } from 'src/modules/user/model/entities/user.entity';
import { ForgetPassword } from 'src/modules/user/model/entities/forget-password.entity';
import { UserModule } from '../user/user.module';
import { ScholarsModule } from '../scholars/scholars.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ForgetPassword]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: `${process.env.JWT_SECONDS_EXPIRE}s` },
      }),
    }),
    UserModule,
    ScholarsModule,
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
