import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { CalledNumber } from '../entities/CalledNumber';
import { BaseRepository } from './BaseRepository';

export class CalledNumberRepository extends BaseRepository<CalledNumber> {
    constructor() {
        super(AppDataSource.getRepository(CalledNumber));
    }

    async findByGame(gameId: number): Promise<CalledNumber[]> {
        return this.repository.find({ where: { game: { id: gameId } }, order: { createdAt: 'DESC' } });
    }

    async getLatestCalledNumbers(gameId: number, limit: number = 10): Promise<CalledNumber[]> {
        return this.repository.find({
            where: { game: { id: gameId } },
            order: { createdAt: 'DESC' },
            take: limit
        });
    }
}