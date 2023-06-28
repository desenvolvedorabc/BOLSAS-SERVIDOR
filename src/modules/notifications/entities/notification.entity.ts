import { User } from 'src/modules/user/model/entities/user.entity';
import { BaseResourceTime } from 'src/shared/entities/BaseResourceTime.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({
  name: 'notifications',
})
export class Notification extends BaseResourceTime {
  @Column({
    type: 'text',
    nullable: false,
    comment: 'Campo destinado a informar o título da notificação',
  })
  title: string;

  @Column({
    type: 'longtext',
    nullable: false,
    comment: 'Campo destinado a informar o corpo da notificação',
  })
  text: string;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  readAt: Date;

  @Column({ type: 'int', nullable: true })
  messageId: number;

  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({
    name: 'userId',
  })
  user: User;

  @Column()
  userId: number;
}
