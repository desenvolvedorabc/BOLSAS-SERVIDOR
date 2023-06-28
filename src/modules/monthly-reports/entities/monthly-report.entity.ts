import { Scholar } from 'src/modules/scholars/entities/scholar.entity';
import { BaseResourceTime } from 'src/shared/entities/BaseResourceTime.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { MonthlyReportStatus } from '../enum/monthly-report-status.enum';
import { ActionMonthlyReport } from './action-monthly-report.entity';
import { LevelApproveRegistration } from '../dto/level-approve-registration.enum';
import { ValidationHistory } from 'src/shared/entities/validation-history.entity';
import { BankRemittance } from 'src/modules/bank-remittances/entities/bank-remittance.entity';

@Entity({
  name: 'month_report',
})
@Index(['month', 'year', 'scholar'], {
  unique: true,
})
export class MonthlyReport extends BaseResourceTime {
  @Column({ nullable: false })
  month: number;

  @Column({ nullable: false })
  year: number;

  @Column({
    type: 'enum',
    nullable: false,
    enum: MonthlyReportStatus,
    default: MonthlyReportStatus.PENDENTE_ENVIO,
  })
  status: MonthlyReportStatus;

  @Column({ type: 'varchar', nullable: true })
  actionDocument: string;

  @OneToMany(() => ActionMonthlyReport, (action) => action.monthlyReport)
  actionsMonthlyReport: ActionMonthlyReport[];

  @Column({
    type: 'enum',
    enum: LevelApproveRegistration,
    nullable: true,
    default: LevelApproveRegistration.MUNICIPIO,
  })
  levelApproveRegistration: LevelApproveRegistration;

  @Column({ type: 'datetime', nullable: true })
  validationAt: Date;

  @OneToOne(() => ValidationHistory)
  @JoinColumn()
  validationHistoryCounty: ValidationHistory;

  @OneToOne(() => ValidationHistory)
  @JoinColumn()
  validationHistoryRegional: ValidationHistory;

  @OneToOne(() => ValidationHistory)
  @JoinColumn()
  validationHistoryState: ValidationHistory;

  @ManyToOne(() => Scholar)
  @JoinColumn({ name: 'scholarId' })
  scholar: Scholar;

  @Column()
  scholarId: number;

  @OneToOne(
    () => BankRemittance,
    (bankRemittance) => bankRemittance.monthlyReport,
  )
  bankRemittance: BankRemittance;
}
