import { BaseResourceTime } from 'src/shared/entities/BaseResourceTime.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { StatusActionMonthlyEnum } from '../enum/status-action-monthly.enum';
import { TrainingModalityEnum } from '../enum/training-modality.enum';
import { MonthlyReport } from './monthly-report.entity';
import { ScheduleWorkPlan } from 'src/modules/work-plans/entities/schedule-work-plan.entity';

@Entity({
  name: 'action_monthly_report',
})
export class ActionMonthlyReport extends BaseResourceTime {
  @Column({
    type: 'longtext',
    nullable: true,
    comment: 'Coluna destinada a informar o detalhamento da ação reliazada.',
  })
  detailing: string;

  @Column({
    type: 'longtext',
    nullable: true,
    comment: 'Coluna destinada a informar o resultado da ação realizada.',
  })
  detailingResult: string;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: 'Coluna destinada a informar a data da formação.',
  })
  trainingDate: Date;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Coluna destinada a informar a carga horária.',
  })
  workloadInMinutes: number;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Coluna destinada a informar a quantidade de formados previstos.',
  })
  qntExpectedGraduates: number;

  @Column({
    type: 'integer',
    nullable: true,
    comment: 'Coluna destinada a informar a quantidade de formados presentes.',
  })
  qntFormedGifts: number;

  @Column({
    type: 'enum',
    nullable: true,
    enum: TrainingModalityEnum,
    comment: 'Coluna destinada a informar a modalidade da formação.',
  })
  trainingModality: TrainingModalityEnum;

  @ManyToOne(
    () => ScheduleWorkPlan,
    (schedule) => schedule.actionsMonthlyReport,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'scheduleWorkPlanId' })
  scheduleWorkPlan: ScheduleWorkPlan;

  @Column()
  scheduleWorkPlanId: number;

  @Column({
    type: 'enum',
    nullable: false,
    enum: StatusActionMonthlyEnum,
    default: StatusActionMonthlyEnum.EM_ANDAMENTO,
  })
  status: StatusActionMonthlyEnum;

  @ManyToOne(() => MonthlyReport, {
    onDelete: 'CASCADE',
  })
  monthlyReport: MonthlyReport;
}
