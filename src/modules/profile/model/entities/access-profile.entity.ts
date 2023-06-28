import { User } from 'src/modules/user/model/entities/user.entity';
import { BaseResourceTime } from 'src/shared/entities/BaseResourceTime.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm';
import { OneToMany } from 'typeorm';
import { ProfileRole } from '../enum/profile-role';
import { Area } from './area.entity';

@Entity({
  name: 'access_profile',
})
export class AccessProfile extends BaseResourceTime {
  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'enum', enum: ProfileRole, default: ProfileRole.PARC })
  role: ProfileRole;

  @ManyToMany(() => Area)
  @JoinTable()
  areas: Area[];

  @OneToMany(() => User, (user) => user.access_profile)
  users: User[];

  @ManyToOne(() => User)
  @JoinColumn()
  createdByUser: User;
}
