import { Module } from '@nestjs/common';
import { TermsOfMembershipService } from './terms-of-membership.service';
import { TermsOfMembershipController } from './terms-of-membership.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TermsOfMembership } from './entities/terms-of-membership.entity';
import { ScholarsModule } from '../scholars/scholars.module';
import { User } from '../user/model/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { MonthlyReport } from '../monthly-reports/entities/monthly-report.entity';
import { SystemParametersModule } from '../system-parameters/system-parameters.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TermsOfMembership, User, MonthlyReport]),
    ScholarsModule,
    NotificationsModule,
    SystemParametersModule,
  ],
  controllers: [TermsOfMembershipController],
  providers: [TermsOfMembershipService],
  exports: [TermsOfMembershipService],
})
export class TermsOfMembershipModule {}
