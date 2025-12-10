import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinTable, ManyToMany } from 'typeorm';
import { User } from './User';
import { Base } from './Base';

@Entity('roles')
export class Role extends Base {
    @Column({ length: 25, unique: true })
    name!: string;

    @Column({ name: 'is_default', default: false })
    isDefault?: boolean;

    @ManyToMany(() => User, user => user.roles)
    @JoinTable({
        name: 'user_roles',
        joinColumn: {
            name: 'role_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'user_id',
            referencedColumnName: 'id'
        }
    })
    users?: User[];
}