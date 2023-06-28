import { PartnerState } from 'src/modules/partner-states/entities/partner-state.entity';
import { BaseResourceTime } from 'src/shared/entities/BaseResourceTime.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity({
  name: 'system_parameters',
})
export class SystemParameter extends BaseResourceTime {
  @Column({ type: 'int', nullable: true })
  dayLimitForMonthlyReport: number;

  @Column({ type: 'int', nullable: true })
  daysLimitForAnalysisMonthlyReport: number;

  @Column({ type: 'int', nullable: true })
  daysLimitSendNotificationForMonthlyReport: number;

  @OneToOne(() => PartnerState, (partnerState) => partnerState.systemParameter)
  @JoinColumn({ name: 'partnerStateId' })
  partnerState: PartnerState;

  @Column()
  partnerStateId: number;
}
