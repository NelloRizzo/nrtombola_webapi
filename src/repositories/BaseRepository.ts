// src/repositories/BaseRepository.ts
import { Repository, FindOptionsWhere, FindManyOptions, FindOneOptions, DeepPartial, UpdateResult, DeleteResult } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Base } from '../entities/Base';

export abstract class BaseRepository<T extends Base> {
    constructor(protected repository: Repository<T>) { }

    // CREATE
    async create(data: DeepPartial<T>): Promise<T> {
        const entity = this.repository.create(data);
        return await this.repository.save(entity);
    }

    async createMany(data: DeepPartial<T>[]): Promise<T[]> {
        const entities = this.repository.create(data);
        return await this.repository.save(entities);
    }

    // READ
    async findById(id: number, relations?: string[]): Promise<T | null> {
        const options: FindOneOptions<T> = {
            where: { id } as FindOptionsWhere<T>
        };

        if (relations?.length) {
            options.relations = relations;
        }

        return await this.repository.findOne(options);
    }

    async findOne(where: FindOptionsWhere<T>, relations?: string[]): Promise<T | null> {
        const options: FindOneOptions<T> = { where };

        if (relations?.length) {
            options.relations = relations;
        }

        return await this.repository.findOne(options);
    }

    async findAll(options?: FindManyOptions<T>): Promise<T[]> {
        return await this.repository.find(options);
    }

    async find(where: FindOptionsWhere<T>, relations?: string[]): Promise<T[]> {
        const options: FindManyOptions<T> = { where };

        if (relations?.length) {
            options.relations = relations;
        }

        return await this.repository.find(options);
    }

    // UPDATE
    async update(id: number, data: QueryDeepPartialEntity<T>): Promise<UpdateResult> {
        return await this.repository.update(id, data);
    }

    async updateBy(where: FindOptionsWhere<T>, data: QueryDeepPartialEntity<T>): Promise<UpdateResult> {
        return await this.repository.update(where, data);
    }

    // DELETE
    async delete(id: number): Promise<DeleteResult> {
        return await this.repository.delete(id);
    }

    async deleteBy(where: FindOptionsWhere<T>): Promise<DeleteResult> {
        return await this.repository.delete(where);
    }

    async softDelete(id: number): Promise<UpdateResult> {
        return await this.repository.softDelete(id);
    }

    async restore(id: number): Promise<UpdateResult> {
        return await this.repository.restore(id);
    }

    // COUNT & EXISTS
    async count(where?: FindOptionsWhere<T>): Promise<number> {
        return await this.repository.count({ where });
    }

    async exists(where: FindOptionsWhere<T>): Promise<boolean> {
        const count = await this.repository.count({ where });
        return count > 0;
    }

    // PAGINATION
    async paginate(
        page: number = 1,
        limit: number = 10,
        options?: Omit<FindManyOptions<T>, 'skip' | 'take'>
    ): Promise<{ data: T[]; total: number; page: number; pages: number; limit: number }> {
        const skip = (page - 1) * limit;

        const [data, total] = await this.repository.findAndCount({
            ...options,
            skip,
            take: limit,
        });

        return {
            data,
            total,
            page,
            pages: Math.ceil(total / limit),
            limit
        };
    }

    // SAVE (per entità già esistenti)
    async save(entity: T): Promise<T> {
        return await this.repository.save(entity);
    }

    async saveMany(entities: T[]): Promise<T[]> {
        return await this.repository.save(entities);
    }

    // QUERY BUILDER
    getQueryBuilder(alias?: string) {
        return this.repository.createQueryBuilder(alias);
    }

    /**
     * Svuota completamente la tabella del database associata a questa entità.
     * Utilizza TRUNCATE TABLE.
     */
    async clear(): Promise<void> {
        // La proprietà queryRunner è accessibile tramite il repository di TypeORM
        // e permette di eseguire operazioni dirette di DDL/DML.
        await this.repository.clear(); 
    }
}