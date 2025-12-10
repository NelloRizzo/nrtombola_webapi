// src/repositories/UserRepository.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User } from '../entities/User';
import { BaseRepository } from './BaseRepository';

export class UserRepository extends BaseRepository<User> {
    constructor() {
        super(AppDataSource.getRepository(User));
    }

    // METODI SPECIFICI PER USER
    async findByEmail(email: string, withRelations: boolean = false): Promise<User | null> {
        const options: any = { where: { email } };
        
        if (withRelations) {
            options.relations = ['games', 'roles']; 
        }

        return await this.repository.findOne(options);
    }

    async findActiveUsers(): Promise<User[]> {
        return await this.find({ isActive: true });
    }

    async findUsersWithRelations(): Promise<User[]> {
        return await this.findAll({
            relations: ['games', 'roles'], // Adatta alle tue relazioni
            order: { createdAt: 'DESC' }
        });
    }

    async searchUsers(query: string): Promise<User[]> {
        return await this.repository
            .createQueryBuilder('user')
            .where('user.name ILIKE :query', { query: `%${query}%` })
            .orWhere('user.email ILIKE :query', { query: `%${query}%` })
            .getMany();
    }

    async updateLastLogin(userId: number): Promise<void> {
        await this.update(userId, { 
            lastLoginAt: new Date() 
        } as any);
    }

    async deactivateUser(userId: number): Promise<void> {
        await this.update(userId, { 
            isActive: false 
        } as any);
    }

    async getUserStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
    }> {
        const [total, active] = await Promise.all([
            this.count(),
            this.count({ isActive: true })
        ]);

        return {
            total,
            active,
            inactive: total - active
        };
    }
}