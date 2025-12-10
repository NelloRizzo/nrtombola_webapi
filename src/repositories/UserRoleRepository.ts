// src/repositories/UserRoleRepository.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { Role } from '../entities/Role';

export class UserRoleRepository {
    private userRepository: Repository<User>;
    private roleRepository: Repository<Role>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
        this.roleRepository = AppDataSource.getRepository(Role);
    }

    async assignRoleToUser(userId: number, roleId: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles']
        });

        if (!user) {
            throw new Error(`User with id ${userId} not found`);
        }

        const role = await this.roleRepository.findOneBy({ id: roleId });
        if (!role) {
            throw new Error(`Role with id ${roleId} not found`);
        }

        if (!user.roles) {
            user.roles = [];
        }

        if (!user.roles.some(r => r.id === roleId)) {
            user.roles.push(role);
            await this.userRepository.save(user);
        }

        return user;
    }

    async removeRoleFromUser(userId: number, roleId: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles']
        });

        if (!user || !user.roles) {
            throw new Error(`User with id ${userId} not found or has no roles`);
        }

        user.roles = user.roles.filter(role => role.id !== roleId);
        return await this.userRepository.save(user);
    }

    async getUserWithRoles(userId: number): Promise<User | null> {
        return await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles']
        });
    }

    async findUsersByRole(roleName: string): Promise<User[]> {
        return await this.userRepository
            .createQueryBuilder('user')
            .innerJoin('user.roles', 'role')
            .where('role.name = :roleName', { roleName })
            .getMany();
    }

    async userHasRole(userId: number, roleName: string): Promise<boolean> {
        const count = await this.userRepository
            .createQueryBuilder('user')
            .innerJoin('user.roles', 'role')
            .where('user.id = :userId', { userId })
            .andWhere('role.name = :roleName', { roleName })
            .getCount();

        return count > 0;
    }
}