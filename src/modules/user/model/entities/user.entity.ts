import { Exclude } from 'class-transformer';
import { PartnerState } from 'src/modules/partner-states/entities/partner-state.entity';
import { AccessProfile } from 'src/modules/profile/model/entities/access-profile.entity';
import { RegionalPartner } from 'src/modules/regional-partners/entities/regional-partner.entity';
import { Scholar } from 'src/modules/scholars/entities/scholar.entity';
import { BaseResourceTime } from 'src/shared/entities/BaseResourceTime.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { CredentialRole } from '../enum/role.enum';
import { SubCredentialRole } from '../enum/sub-role.enum';
import { Notification } from 'src/modules/notifications/entities/notification.entity';

@Entity({ name: 'users' })
@Index(['partnerStateId', 'regionalPartnerId'], {
  unique: false,
})
@Index(['partnerStateId', 'regionalPartnerId', 'city'], {
  unique: false,
})
export class User extends BaseResourceTime {
  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: false })
  email: string;

  @Column({ type: 'varchar', nullable: false })
  telephone: string;

  @Column({ type: 'enum', enum: CredentialRole })
  role: CredentialRole;

  @Column({ type: 'enum', enum: SubCredentialRole, nullable: true })
  subRole: SubCredentialRole;

  @Column({ type: 'varchar', nullable: true })
  image_profile: string;

  @Column({ type: 'varchar', nullable: false, select: false })
  @Exclude()
  password: string;

  @Column({ type: 'varchar', nullable: false, length: 11 })
  cpf: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'boolean', default: false })
  isChangePasswordWelcome: boolean;

  @Column({ type: 'varchar', nullable: true })
  city: string;

  @BeforeInsert()
  @BeforeUpdate()
  emailToLowerCase() {
    this.email = this.email.toLowerCase();
  }

  @ManyToOne(() => AccessProfile, (accessProfile) => accessProfile.users)
  access_profile: AccessProfile;

  @ManyToOne(() => RegionalPartner, (regional) => regional.users)
  @JoinColumn({ name: 'regionalPartnerId' })
  regionalPartner: RegionalPartner;

  @Column({ nullable: true })
  regionalPartnerId: number;

  @ManyToOne(() => PartnerState, (partnerState) => partnerState.users)
  @JoinColumn({ name: 'partnerStateId' })
  partner_state: PartnerState;

  @Column({ nullable: true })
  partnerStateId: number;

  @OneToOne(() => Scholar, (scholar) => scholar.user)
  scholar: Scholar;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
