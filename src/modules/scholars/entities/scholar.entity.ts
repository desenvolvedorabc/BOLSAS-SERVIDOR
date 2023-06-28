import { User } from 'src/modules/user/model/entities/user.entity';
import { BaseResourceTime } from 'src/shared/entities/BaseResourceTime.entity';
import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { LevelApproveRegistration } from '../enum/level-approve-registration.enum';
import { RegistrationLevel } from '../enum/registration-level.enum';
import { StatusRegistration } from '../enum/status-registration.enum';
import { ValidationHistory } from 'src/shared/entities/validation-history.entity';
import { TermsOfMembership } from 'src/modules/terms-of-membership/entities/terms-of-membership.entity';
import { AccountTypeEnum } from '../enum/account-type.enum';

@Entity({
  name: 'scholars',
})
export class Scholar extends BaseResourceTime {
  @Column({ type: 'varchar' })
  axle: string;

  @Column({ type: 'boolean', default: false })
  isFormer: boolean;

  @Column({ type: 'varchar', nullable: true })
  rg: string;

  @Column({ type: 'varchar', nullable: true })
  sex: string;

  @Column({ type: 'varchar', nullable: true })
  maritalStatus: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'varchar', nullable: true })
  motherName: string;

  @Column({ type: 'varchar', nullable: true })
  fatherName: string;

  @Column({ type: 'varchar', nullable: true })
  cep: string;

  @Column({ type: 'varchar', nullable: true })
  state: string;

  @Column({ type: 'varchar', nullable: true })
  city: string;

  @Column({ type: 'varchar', nullable: true })
  address: string;

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

  @Column({ type: 'varchar', nullable: true })
  accountNumber: string;

  @Column({ type: 'varchar', nullable: true })
  trainingArea: string;

  @Column({ type: 'varchar', nullable: true })
  highestDegree: string;

  @Column({ type: 'varchar', nullable: true })
  employmentRelationship: string;

  @Column({ type: 'varchar', nullable: true })
  instituteOfOrigin: string;

  @Column({ type: 'varchar', nullable: true })
  functionalStatus: string;

  @Column({ type: 'varchar', nullable: true })
  locationDevelopWorkPlan: string;

  @Column({ type: 'varchar', nullable: true })
  bagDescription: string;

  @Column({ type: 'varchar', nullable: true })
  agreementOfTheEducationNetwork: string;

  @Column({ type: 'varchar', nullable: true })
  curriculumVitae: string;

  @Column({ type: 'varchar', nullable: true })
  copyHigherTitle: string;

  @Column({ type: 'varchar', nullable: true })
  copyRgFrontAndVerse: string;

  @Column({ type: 'varchar', nullable: true })
  copyCpfFrontAndVerse: string;

  @Column({ type: 'varchar', nullable: true })
  currentAccountCopy: string;

  @Column({ type: 'varchar', nullable: true })
  proofOfAddress: string;

  @Column({ type: 'varchar', nullable: true })
  medicalCertificate: string;

  @Column({
    type: 'enum',
    enum: RegistrationLevel,
    nullable: true,
    default: null,
  })
  registrationLevel: RegistrationLevel;

  @Column({
    type: 'enum',
    enum: LevelApproveRegistration,
    nullable: true,
    default: null,
  })
  levelApproveRegistration: LevelApproveRegistration;

  @Column({
    type: 'enum',
    enum: StatusRegistration,
    nullable: true,
    default: StatusRegistration.PENDENTE_ENVIO,
  })
  statusRegistration: StatusRegistration;

  @OneToOne(() => ValidationHistory)
  @JoinColumn()
  validationHistoryCounty: ValidationHistory;

  @OneToOne(() => ValidationHistory)
  @JoinColumn()
  validationHistoryRegional: ValidationHistory;

  @OneToOne(() => User, (user) => user.scholar)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToOne(() => TermsOfMembership, (term) => term.scholar)
  termOfMembership: TermsOfMembership;

  @Column()
  userId: number;
}
