import { Scholar } from 'src/modules/scholars/entities/scholar.entity';
import { BaseResourceTime } from 'src/shared/entities/BaseResourceTime.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { TermOfMembershipStatus } from '../enum/status-term-membership.enum';

@Entity({
  name: 'terms_of_membership',
})
export class TermsOfMembership extends BaseResourceTime {
  @Column({ type: 'text', nullable: false })
  project: string;

  @Column({ type: 'text', nullable: false })
  workUnit: string;

  @Column({ type: 'text', nullable: false })
  city: string;

  @Column({ type: 'longtext', nullable: false })
  contractDescription: string;

  @Column({ type: 'varchar', nullable: false })
  axle: string;

  @Column({ type: 'text', nullable: false })
  payingSource: string;

  @Column({ type: 'int', nullable: false })
  weekHours: number;

  @Column({ type: 'int', nullable: false })
  scholarshipValueInCents: number;

  @Column({ type: 'text', nullable: false })
  bagName: string;

  @Column({ nullable: false, type: 'datetime' })
  startDate: Date;

  @Column({ nullable: false, type: 'datetime' })
  endDate: Date;

  @Column({ nullable: true, type: 'datetime' })
  extensionDate: Date;

  @Column({ nullable: true, type: 'datetime' })
  signedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  signedDocument: string;

  @Column({ nullable: true, type: 'datetime' })
  cancelAt: Date;

  @Column({ type: 'varchar', nullable: true })
  cancelDocument: string;

  @Column({
    type: 'enum',
    enum: TermOfMembershipStatus,
    nullable: false,
    default: TermOfMembershipStatus.PENDENTE_ASSINATURA,
  })
  status: TermOfMembershipStatus;

  @OneToOne(() => Scholar, (scholar) => scholar.termOfMembership)
  @JoinColumn({ name: 'scholarId' })
  scholar: Scholar;

  @Column()
  scholarId: number;
}
