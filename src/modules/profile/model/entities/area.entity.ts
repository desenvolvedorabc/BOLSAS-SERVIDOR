import { CredentialRole } from '../../../user/model/enum/role.enum';
import { BaseResourceTime } from '../../../../shared/entities/BaseResourceTime.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';

@Entity({
  name: 'areas',
})
export class Area extends BaseResourceTime {
  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'enum', enum: CredentialRole })
  role: CredentialRole;

  @Column({ type: 'varchar', nullable: false })
  tag: string;

  @BeforeInsert()
  @BeforeUpdate()
  emailToLowerCase() {
    this.tag = this.tag.toUpperCase();
  }
}
