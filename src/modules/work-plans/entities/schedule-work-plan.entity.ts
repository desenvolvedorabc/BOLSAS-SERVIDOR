import { BaseResourceTime } from 'src/shared/entities/BaseResourceTime.entity';
import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { WorkPlan } from './work-plan.entity';
import { ActionMonthlyReport } from 'src/modules/monthly-reports/entities/action-monthly-report.entity';
import { StatusActionMonthlyEnum } from 'src/modules/monthly-reports/enum/status-action-monthly.enum';

@Entity({
  name: 'schedule_work_plan',
})
@Index(['month', 'year'], {
  unique: false,
})
export class ScheduleWorkPlan extends BaseResourceTime {
  @Column({ nullable: false })
  month: number;

  @Column({ nullable: false })
  year: number;

  @Column({
    type: 'longtext',
    nullable: false,
    comment:
      'Coluna destinada a informar o tipo de ação dentro de um cronograma',
  })
  action: string;

  @Column({ type: 'boolean', default: false })
  isFormer: boolean;

  @OneToMany(() => ActionMonthlyReport, (action) => action.scheduleWorkPlan)
  actionsMonthlyReport: ActionMonthlyReport[];

  @Column({
    type: 'enum',
    nullable: false,
    enum: StatusActionMonthlyEnum,
    default: StatusActionMonthlyEnum.EM_ANDAMENTO,
  })
  status: StatusActionMonthlyEnum;

  @ManyToOne(() => WorkPlan, (workPlan) => workPlan.schedules, {
    onDelete: 'CASCADE',
  })
  workPlan: WorkPlan;
}
