// src/repositories/RoleRepository.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Role } from '../entities/Role';
import { BaseRepository } from './BaseRepository';

export class RoleRepository extends BaseRepository<Role> {
    constructor() {
        super(AppDataSource.getRepository(Role));
    }

    // METODI SPECIFICI PER ROLE
    async findByName(name: string): Promise<Role | null> {
        return await this.findOne({ name });
    }

    async findDefaultRoles(): Promise<Role[]> {
        return await this.find({ isDefault: true });
    }

    async findRolesWithUsers(): Promise<Role[]> {
        return await this.findAll({
            relations: ['users'],
            order: { name: 'ASC' }
        });
    }

    async assignPermissions(roleId: number, permissions: string[]): Promise<Role | null> {
        await this.update(roleId, { permissions } as any);
        return await this.findById(roleId);
    }

    async getRolesWithPermission(permission: string): Promise<Role[]> {
        return await this.repository
            .createQueryBuilder('role')
            .where('role.permissions ::jsonb ? :permission', { permission })
            .getMany();
    }
}