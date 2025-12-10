import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinTable, ManyToMany, OneToMany, ManyToOne } from 'typeorm';
import { User } from './User';
import { Base } from './Base';
import { CalledNumber } from './CalledNumber';

@Entity('games')
export class Game extends Base {
    @Column({ length: 80 })
    name!: string;

    @Column({ name: 'started_at', nullable: true })
    startedAt?: Date;

    @Column({ name: 'ended_at', nullable: true })
    endedAt?: Date;

    @ManyToOne(() => User, user => user.games)
    owner!: User;

    @OneToMany(() => CalledNumber, number => number.game)
    calledNumbers?: CalledNumber[];
}