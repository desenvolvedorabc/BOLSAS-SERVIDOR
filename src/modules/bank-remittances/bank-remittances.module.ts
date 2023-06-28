import { Module } from '@nestjs/common';
import { BankRemittancesService } from './bank-remittances.service';
import { BankRemittancesController } from './bank-remittances.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonthlyReport } from '../monthly-reports/entities/monthly-report.entity';
import { BankRemittance } from './entities/bank-remittance.entity';
import { RegionalPartner } from '../regional-partners/entities/regional-partner.entity';
import { RegionalPartnersModule } from '../regional-partners/regional-partners.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BankRemittance, MonthlyReport, RegionalPartner]),
    RegionalPartnersModule,
  ],
  controllers: [BankRemittancesController],
  providers: [BankRemittancesService],
  exports: [BankRemittancesService],
})
export class BankRemittancesModule {}
