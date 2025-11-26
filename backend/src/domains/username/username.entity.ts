import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('usernames')
export class Username {
  // Например: "alice_dev"
  @PrimaryColumn({ type: 'varchar', length: 32 })
  username!: string;

  @OneToOne(() => User, (user) => user.username, { onDelete: 'CASCADE' })
  @JoinColumn()
  user!: User;

  // Разрешён ли поиск по этому имени?
  @Column({ type: 'boolean', default: false })
  isSearchable!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
