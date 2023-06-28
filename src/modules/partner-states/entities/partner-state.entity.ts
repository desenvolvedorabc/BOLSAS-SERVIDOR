import { RegionalPartner } from 'src/modules/regional-partners/entities/regional-partner.entity';
import { SystemParameter } from 'src/modules/system-parameters/entities/system-parameter.entity';
import { User } from 'src/modules/user/model/entities/user.entity';
import { BaseResourceTime } from 'src/shared/entities/BaseResourceTime.entity';
import { Column, Entity, OneToMany, OneToOne } from 'typeorm';

@Entity({
  name: 'partner_states',
})
export class PartnerState extends BaseResourceTime {
  @Column({ type: 'varchar', nullable: false, unique: true })
  name: string;

  @Column({ type: 'varchar', nullable: false })
  cod_ibge: string;

  @Column({ type: 'varchar', nullable: false, length: 2, unique: true })
  abbreviation: string;

  @Column({ type: 'varchar', nullable: true })
  logo: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  slug: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'varchar', nullable: true })
  color: string;

  @OneToOne(
    () => SystemParameter,
    (systemParameter) => systemParameter.partnerState,
  )
  systemParameter: SystemParameter;

  @OneToMany(() => User, (user) => user.partner_state)
  users: User[];

  @OneToMany(
    () => RegionalPartner,
    (regionalPartner) => regionalPartner.partnerState,
  )
  regionalPartners: RegionalPartner[];
}
