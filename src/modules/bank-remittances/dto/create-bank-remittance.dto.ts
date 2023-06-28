import { MonthlyReport } from 'src/modules/monthly-reports/entities/monthly-report.entity';
import { AccountTypeEnum } from 'src/modules/scholars/enum/account-type.enum';

export class CreateBankRemittanceDto {
  bank: string;

  agency: string;

  accountType: AccountTypeEnum;

  scholarshipValueInCents: number;

  termOfMembershipId: number;

  accountNumber: string;

  monthlyReport: MonthlyReport;
}
