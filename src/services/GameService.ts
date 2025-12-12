// src/services/GameService.ts
import { GameRepository } from '../repositories/GameRepository';
import { CalledNumberRepository } from '../repositories/CalledNumberRepository';
import { UserRepository } from '../repositories/UserRepository';
import { CardRepositoryInstance } from '../repositories/CardRepository';
import { CardEvaluationService, WinLevel } from './CardEvaluationService';

export class GameService {
    private gameRepository: GameRepository;
    private calledNumberRepository: CalledNumberRepository;
    private userRepository: UserRepository;

    constructor() {
        this.gameRepository = new GameRepository();
        this.calledNumberRepository = new CalledNumberRepository();
        this.userRepository = new UserRepository();
    }

    // Creare una nuova partita (solo utenti con ruolo 'caller')
    async createGame(userId: number, name: string): Promise<any> {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                return { success: false, error: 'User not found' };
            }

            const game = await this.gameRepository.create({
                name,
                owner: user
            });

            return {
                success: true,
                game: {
                    id: game.id,
                    name: game.name,
                    ownerId: game.owner.id,
                    createdAt: game.createdAt
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create game'
            };
        }
    }

    // Avviare una partita (solo 'caller' e proprietario)
    async startGame(userId: number, gameId: number): Promise<any> {
        try {

            const game = await this.gameRepository.findById(gameId, ['owner']);
            if (!game) {
                return { success: false, error: 'Game not found' };
            }

            if (game.owner.id !== userId) {
                return { success: false, error: 'Only game owner can start the game' };
            }

            if (game.startedAt) {
                return { success: false, error: 'Game already started' };
            }

            await this.gameRepository.startGame(gameId);

            return {
                success: true,
                message: 'Game started successfully',
                gameId,
                startedAt: new Date()
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to start game'
            };
        }
    }

    // Terminare una partita (solo 'caller' e proprietario)
    async endGame(userId: number, gameId: number): Promise<any> {
        try {
            const game = await this.gameRepository.findById(gameId, ['owner']);
            if (!game) {
                return { success: false, error: 'Game not found' };
            }

            if (game.owner.id !== userId) {
                return { success: false, error: 'Only game owner can end the game' };
            }

            if (game.endedAt) {
                return { success: false, error: 'Game already ended' };
            }

            await this.gameRepository.endGame(gameId);

            return {
                success: true,
                message: 'Game ended successfully',
                gameId,
                endedAt: new Date()
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to end game'
            };
        }
    }

    // Estrarre un numero (solo 'caller' e proprietario)
    async drawNumber(userId: number, gameId: number, number: number): Promise<any> {
        try {
            const game = await this.gameRepository.findById(gameId, ['owner']);

            if (!game) {
                return { success: false, error: 'Game not found' };
            }

            if (game.owner.id !== userId) {
                return { success: false, error: 'Only game owner can draw numbers' };
            }

            if (!game.startedAt) {
                return { success: false, error: 'Game not started yet' };
            }

            if (game.endedAt) {
                return { success: false, error: 'Game already ended' };
            }

            // Verifica se il numero è già stato estratto
            const existingNumbers = await this.calledNumberRepository.findByGame(gameId);
            if (existingNumbers.some(cn => cn.number === number)) {
                return { success: false, error: 'Number already drawn' };
            }

            // Verifica validità numero (1-90 per tombola)
            if (number < 1 || number > 90) {
                return { success: false, error: 'Number must be between 1 and 90' };
            }

            const calledNumber = await this.calledNumberRepository.create({
                number,
                game
            });

            return {
                success: true,
                number: {
                    id: calledNumber.id,
                    number: calledNumber.number,
                    drawnAt: calledNumber.createdAt,
                    gameId
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to draw number'
            };
        }
    }

    // Estrarre un numero casuale non ancora estratto
    async drawRandomNumber(userId: number, gameId: number): Promise<any> {
        try {
            const game = await this.gameRepository.findById(gameId, ['owner']);
            if (!game) {
                return { success: false, error: 'Game not found' };
            }

            if (game.owner.id !== userId) {
                return { success: false, error: 'Only game owner can draw numbers' };
            }

            if (!game.startedAt) {
                return { success: false, error: 'Game not started yet' };
            }

            if (game.endedAt) {
                return { success: false, error: 'Game already ended' };
            }

            const existingNumbers = await this.calledNumberRepository.findByGame(gameId);
            const drawnNumbers = existingNumbers.map(cn => cn.number);

            // Tutti i numeri estratti (tombola completa)
            if (drawnNumbers.length >= 90) {
                return { success: false, error: 'All numbers have been drawn' };
            }

            // Trova un numero casuale non estratto
            let randomNumber: number;
            do {
                randomNumber = Math.floor(Math.random() * 90) + 1; // 1-90
            } while (drawnNumbers.includes(randomNumber));

            return await this.drawNumber(userId, gameId, randomNumber);
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to draw random number'
            };
        }
    }

    // Leggere i numeri estratti (tutti gli utenti)
    async getCalledNumbers(gameId: number): Promise<any> {
        try {
            const game = await this.gameRepository.findById(gameId);
            if (!game) {
                return { success: false, error: 'Game not found' };
            }

            const calledNumbers = await this.calledNumberRepository.findByGame(gameId);

            return {
                success: true,
                gameId,
                gameName: game.name,
                totalNumbers: calledNumbers.length,
                numbers: calledNumbers.map(cn => ({
                    id: cn.id,
                    number: cn.number,
                    drawnAt: cn.createdAt
                })).sort((a, b) => a.number - b.number) // Ordina per numero
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get called numbers'
            };
        }
    }

    // Leggere ultimi numeri estratti
    async getLatestNumbers(gameId: number, limit: number = 10): Promise<any> {
        try {
            const game = await this.gameRepository.findById(gameId);
            if (!game) {
                return { success: false, error: 'Game not found' };
            }

            const latestNumbers = await this.calledNumberRepository.getLatestCalledNumbers(gameId, limit);

            return {
                success: true,
                gameId,
                numbers: latestNumbers.map(cn => ({
                    id: cn.id,
                    number: cn.number,
                    drawnAt: cn.createdAt
                }))
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get latest numbers'
            };
        }
    }

    // Ottenere lo stato della partita
    async getGameStatus(gameId: number): Promise<any> {
        try {
            const game = await this.gameRepository.findGameWithNumbers(gameId);
            if (!game) {
                return { success: false, error: 'Game not found' };
            }

            const calledNumbers = game.calledNumbers || [];
            const drawnNumbers = calledNumbers.map(cn => cn.number);

            return {
                success: true,
                game: {
                    id: game.id,
                    name: game.name,
                    ownerId: game.owner.id,
                    ownerName: game.owner.name,
                    startedAt: game.startedAt,
                    endedAt: game.endedAt,
                    isActive: !game.endedAt && !!game.startedAt,
                    totalNumbersDrawn: drawnNumbers.length,
                    drawnNumbers: drawnNumbers,
                    lastDraw: calledNumbers.length > 0
                        ? calledNumbers[calledNumbers.length - 1]
                        : null
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get game status'
            };
        }
    }

    // Lista di tutte le partite attive
    async getActiveGames(): Promise<any> {
        try {
            const games = await this.gameRepository.findActiveGames();

            return {
                success: true,
                total: games.length,
                games: games.map(game => ({
                    id: game.id,
                    name: game.name,
                    ownerId: game.owner.id,
                    ownerName: game.owner.name,
                    startedAt: game.startedAt,
                    playerCount: 0 // Da implementare se aggiungi giocatori
                }))
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get active games'
            };
        }
    }

    // Partite di un utente
    async getUserGames(userId: number): Promise<any> {
        try {
            const games = await this.gameRepository.findByOwner(userId);

            return {
                success: true,
                userId,
                total: games.length,
                games: games.map(game => ({
                    id: game.id,
                    name: game.name,
                    startedAt: game.startedAt,
                    endedAt: game.endedAt,
                    isActive: !game.endedAt && !!game.startedAt,
                    createdAt: game.createdAt,
                    ownerId: game.owner.id
                }))
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get user games'
            };
        }
    }

    // Assumiamo che il gameId sia fornito
    async checkWinningForGame(gameId: number, cardId: number): Promise<WinLevel> {
        // 1. Recupera i dati necessari
        const gameStatus = await this.getGameStatus(gameId); // Funzione che recupera lo stato del gioco
        const drawnNumbers = gameStatus.game.drawnNumbers;

        // 2. Recupera la cartella
        const card = await CardRepositoryInstance.findById(cardId);

        if (card === null) return WinLevel.NONE;

        // 3. Esegui la valutazione
        return CardEvaluationService.evaluateMaxWin(card, drawnNumbers);
    }
}