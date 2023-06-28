import { User } from 'src/modules/user/model/entities/user.entity';
import { BaseResourceTime } from 'src/shared/entities/BaseResourceTime.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity({
  name: 'validations_history',
})
export class ValidationHistory extends BaseResourceTime {
  @Column({ type: 'varchar' })
  status: string;

  @Column({ type: 'longtext', nullable: true })
  justificationReprove: string;

  @ManyToOne(() => User)
  user: User;
}
