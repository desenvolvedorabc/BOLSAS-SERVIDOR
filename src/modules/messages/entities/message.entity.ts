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

@Entity({
  name: 'messages',
})
export class Message extends BaseResourceTime {
  @Column({
    type: 'text',
    comment: 'Campo destinado a informar o título da mensagem',
  })
  title: string;

  @Column({
    type: 'longtext',
    comment: 'Campo destinado a informar o corpo da mensagem',
  })
  text: string;

  @Column({
    type: 'datetime',
    nullable: true,
  })
  deletedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn()
  createdByUser: User;

  @Column()
  createdByUserId: number;

  @ManyToMany(() => User)
  @JoinTable()
  users: User[];
}
