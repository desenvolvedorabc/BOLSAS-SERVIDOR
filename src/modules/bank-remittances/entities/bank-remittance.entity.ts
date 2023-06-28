import { MonthlyReport } from 'src/modules/monthly-reports/entities/monthly-report.entity';
import { AccountTypeEnum } from 'src/modules/scholars/enum/account-type.enum';
import { BaseResourceTime } from 'src/shared/entities/BaseResourceTime.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity({
  name: 'bank_remittances',
})
export class BankRemittance extends BaseResourceTime {
  @Column({ type: 'varchar', nullable: true })
  bank: string;

  @Column({ type: 'varchar', nullable: true })
  agency: string;

  @Column({
    type: 'enum',
    enum: AccountTypeEnum,
    nullable: true,
  })
  accountType: AccountTypeEnum;

  @Column({ type: 'int', nullable: false })
  scholarshipValueInCents: number;

  @Column({ type: 'varchar', nullable: true })
  accountNumber: string;

  @Column({ type: 'int', nullable: true })
  termOfMembershipId: number;

  @OneToOne(
    () => MonthlyReport,
    (monthlyReport) => monthlyReport.bankRemittance,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn()
  monthlyReport: MonthlyReport;
}
