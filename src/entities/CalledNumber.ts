import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinTable, ManyToMany, OneToMany, ManyToOne } from 'typeorm';
import { Base } from './Base';
import { Game } from './Game';

@Entity('called_numbers')
export class CalledNumber extends Base {
    @ManyToOne(() => Game, game => game.calledNumbers)
    game!: Game

    @Column()
    number!: number
}