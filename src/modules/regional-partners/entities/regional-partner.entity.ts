import { PartnerState } from 'src/modules/partner-states/entities/partner-state.entity';
import { User } from 'src/modules/user/model/entities/user.entity';
import { BaseResourceTime } from 'src/shared/entities/BaseResourceTime.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity({
  name: 'regional_partners',
})
export class RegionalPartner extends BaseResourceTime {
  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'varchar', nullable: false })
  abbreviation: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column('simple-array')
  cities: string[];

  @OneToMany(() => User, (user) => user.regionalPartner)
  users: User[];

  @ManyToOne(
    () => PartnerState,
    (partnerState) => partnerState.regionalPartners,
  )
  @JoinColumn({ name: 'partnerStateId' })
  partnerState: PartnerState;

  @Column()
  partnerStateId: number;
}
