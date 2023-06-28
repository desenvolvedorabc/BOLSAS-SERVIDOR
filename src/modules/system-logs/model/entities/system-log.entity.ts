import { User } from 'src/modules/user/model/entities/user.entity';
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Column,
  Entity,
} from 'typeorm';

@Entity({
  name: 'system_logs',
})
export class SystemLogs {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  method: string;

  @Column()
  nameEntity: string;

  @Column({
    type: 'longtext',
    nullable: true,
  })
  stateInitial: string;

  @Column({
    type: 'longtext',
    nullable: true,
  })
  stateFinal: string;

  @ManyToOne(() => User)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
