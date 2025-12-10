import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BaseEntity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { Base } from './Base';
import { Role } from './Role';
import { Game } from './Game';

@Entity('users')
export class User extends Base {
    @Column({ length: 25 })
    name!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ length: 255 })
    password!: string;

    @Column({ nullable: true, name: 'external_id' })
    externalId?: string; // Per dati da API esterne

    @Column({ name: 'is_active', default: true })
    isActive!: boolean;

    @UpdateDateColumn({ name: 'last_login' })
    lastLogin?: Date;

    @ManyToMany(() => Role, role => role.users)
    @JoinTable({
        name: 'user_roles',
        joinColumn: {
            name: 'user_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'role_id',
            referencedColumnName: 'id'
        }
    })
    roles?: Role[];

    @OneToMany(() => Game, game => game.owner)
    games?: Game[];
}