import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { LoggerModule } from 'nestjs-pino';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfileModule } from './modules/profile/profile.module';
import { AppController } from './app.controller';
import { EverythingSubscriber } from './utils/event-subscriber';
import { SystemLogsModule } from './modules/system-logs/system-logs.module';
import { PartnerStatesModule } from './modules/partner-states/partner-states.module';
import { RegionalPartnersModule } from './modules/regional-partners/regional-partners.module';
import { WorkPlansModule } from './modules/work-plans/work-plans.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler/dist/throttler.guard';
import { ScholarsModule } from './modules/scholars/scholars.module';
import { MonthlyReportsModule } from './modules/monthly-reports/monthly-reports.module';
import { TermsOfMembershipModule } from './modules/terms-of-membership/terms-of-membership.module';
import { SystemParametersModule } from './modules/system-parameters/system-parameters.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MessagesModule } from './modules/messages/messages.module';
import { BankRemittancesModule } from './modules/bank-remittances/bank-remittances.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { SystemIndicatorsModule } from './modules/system-indicators/system-indicators.module';
import { DatabaseConfig } from './config/database-config.factory';
import configuration from './config/configuration';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
    ThrottlerModule.forRoot({
      ttl: 5,
      limit: 40,
    }),
    MulterModule.register({
      dest: './public',
      limits: { fileSize: 2 * 1048576 }, //2MB
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
    AuthModule,
    UserModule,
    ProfileModule,
    SystemLogsModule,
    PartnerStatesModule,
    RegionalPartnersModule,
    WorkPlansModule,
    ScholarsModule,
    MonthlyReportsModule,
    TermsOfMembershipModule,
    SystemParametersModule,
    NotificationsModule,
    MessagesModule,
    BankRemittancesModule,
    JobsModule,
    SystemIndicatorsModule,
  ],
  providers: [
    EverythingSubscriber,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
