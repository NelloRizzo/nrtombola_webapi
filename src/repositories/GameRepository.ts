import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Game } from '../entities/Game';
import { BaseRepository } from './BaseRepository';

export class GameRepository extends BaseRepository<Game> {
    constructor() {
        super(AppDataSource.getRepository(Game));
    }

    async findByOwner(ownerId: number): Promise<Game[]> {
        return this.repository.find({
            where: { owner: { id: ownerId } },
            order: { createdAt: 'DESC' }
        });
    }

    async findActiveGames(): Promise<Game[]> {
        return this.repository.find({
            where: { endedAt: undefined },
            relations: ['owner']
        });
    }

    async findGameWithNumbers(gameId: number): Promise<Game | null> {
        return this.repository.findOne({
            where: { id: gameId },
            relations: ['owner', 'calledNumbers']
        });
    }

    async startGame(gameId: number): Promise<void> {
        await this.repository.update(gameId, { startedAt: new Date() });
    }

    async endGame(gameId: number): Promise<void> {
        await this.repository.update(gameId, { endedAt: new Date() });
    }
}