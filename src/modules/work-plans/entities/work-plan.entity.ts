import { User } from 'src/modules/user/model/entities/user.entity';
import { BaseResourceTime } from 'src/shared/entities/BaseResourceTime.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { WorkPlanStatus } from '../enum/work-plan-status.enum';
import { ScheduleWorkPlan } from './schedule-work-plan.entity';

@Entity({
  name: 'work_plans',
})
export class WorkPlan extends BaseResourceTime {
  @Column({
    type: 'enum',
    enum: WorkPlanStatus,
    default: WorkPlanStatus.PENDENTE_ENVIO,
  })
  status: WorkPlanStatus;

  @Column({ nullable: true, default: null, type: 'longtext' })
  justificationReprove: string;

  @Column({ type: 'longtext', nullable: false })
  justification: string;

  @Column({ type: 'longtext', nullable: false })
  generalObjectives: string;

  @Column({ type: 'longtext', nullable: false })
  specificObjectives: string;

  @Column({ type: 'datetime', nullable: true })
  sendValidationAt: Date;

  @Column({ type: 'datetime', nullable: true })
  validationAt: Date;

  @OneToMany(() => ScheduleWorkPlan, (schedule) => schedule.workPlan)
  schedules: ScheduleWorkPlan[];

  @ManyToOne(() => User)
  @JoinColumn()
  scholar: User;
}
