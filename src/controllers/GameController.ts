// src/controllers/GameController.ts
import { Request, Response } from 'express';
import { GameService } from '../services/GameService';
import { AuthenticatedRequest, authMiddleware } from '../middleware/AuthMiddleware';
import { WinLevel } from '../services/CardEvaluationService';

export class GameController {
    private gameService: GameService;

    constructor() {
        this.gameService = new GameService();
    }

    // Middleware per verificare se l'utente è il proprietario del gioco
    private async isGameOwner(req: AuthenticatedRequest, res: Response, next: Function): Promise<void> {
        try {
            const gameId = parseInt(req.params.gameId);
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }

            // Puoi implementare una verifica più efficiente
            // Per ora usiamo il service
            const game = await this.gameService.getGameStatus(gameId);

            if (!game.success) {
                res.status(404).json(game);
                return;
            }

            if (game.game.ownerId !== userId) {
                res.status(403).json({
                    success: false,
                    error: 'Only game owner can perform this action'
                });
                return;
            }

            next();
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // Middleware per verificare se la partita è attiva
    private async isGameActive(req: AuthenticatedRequest, res: Response, next: Function): Promise<void> {
        try {
            const gameId = parseInt(req.params.gameId);
            const game = await this.gameService.getGameStatus(gameId);

            if (!game.success) {
                res.status(404).json(game);
                return;
            }

            if (!game.game.isActive) {
                res.status(400).json({
                    success: false,
                    error: 'Game is not active'
                });
                return;
            }

            next();
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // Middleware per verificare se la partita è avviata
    private async isGameStarted(req: AuthenticatedRequest, res: Response, next: Function): Promise<void> {
        try {
            const gameId = parseInt(req.params.gameId);
            const game = await this.gameService.getGameStatus(gameId);

            if (!game.success) {
                res.status(404).json(game);
                return;
            }

            if (!game.game.startedAt) {
                res.status(400).json({
                    success: false,
                    error: 'Game not started yet'
                });
                return;
            }

            if (game.game.endedAt) {
                res.status(400).json({
                    success: false,
                    error: 'Game already ended'
                });
                return;
            }

            next();
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // POST /api/games - Crea nuova partita (solo caller)
    async createGame(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const { name } = req.body;

            if (!userId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }

            if (!name) {
                res.status(400).json({ success: false, error: 'Game name is required' });
                return;
            }

            const result = await this.gameService.createGame(userId, name);

            if (result.success) {
                res.status(201).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // POST /api/games/:gameId/start - Avvia partita (solo owner)
    async startGame(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const gameId = parseInt(req.params.gameId);

            if (!userId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }

            const result = await this.gameService.startGame(userId, gameId);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // POST /api/games/:gameId/end - Termina partita (solo owner)
    async endGame(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const gameId = parseInt(req.params.gameId);

            if (!userId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }

            const result = await this.gameService.endGame(userId, gameId);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // POST /api/games/:gameId/draw - Estrai numero specifico (solo owner + partita attiva)
    async drawNumber(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const gameId = parseInt(req.params.gameId);
            const { number } = req.body;

            if (!userId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }

            if (!number || isNaN(number)) {
                res.status(400).json({ success: false, error: 'Valid number is required' });
                return;
            }

            const result = await this.gameService.drawNumber(userId, gameId, parseInt(number));

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // POST /api/games/:gameId/draw/random - Estrai numero casuale (solo owner + partita attiva)
    async drawRandomNumber(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            const gameId = parseInt(req.params.gameId);

            if (!userId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }

            const result = await this.gameService.drawRandomNumber(userId, gameId);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // GET /api/games/:gameId/numbers - Leggi numeri estratti (pubblico)
    async getCalledNumbers(req: Request, res: Response): Promise<void> {
        try {
            const gameId = parseInt(req.params.gameId);
            const result = await this.gameService.getCalledNumbers(gameId);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(404).json(result);
            }
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // GET /api/games/:gameId/numbers/latest - Ultimi numeri estratti (pubblico)
    async getLatestNumbers(req: Request, res: Response): Promise<void> {
        try {
            const gameId = parseInt(req.params.gameId);
            const limit = parseInt(req.query.limit as string) || 10;

            if (limit > 50) {
                res.status(400).json({ success: false, error: 'Limit cannot exceed 50' });
                return;
            }

            const result = await this.gameService.getLatestNumbers(gameId, limit);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(404).json(result);
            }
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // GET /api/games/:gameId/status - Stato partita (pubblico)
    async getGameStatus(req: Request, res: Response): Promise<void> {
        try {
            const gameId = parseInt(req.params.gameId);
            const result = await this.gameService.getGameStatus(gameId);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(404).json(result);
            }
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // GET /api/games/active - Partite attive (pubblico)
    async getActiveGames(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.gameService.getActiveGames();
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // GET /api/games/my-games - Partite dell'utente (autenticato)
    async getUserGames(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;

            if (!userId) {
                res.status(401).json({ success: false, error: 'Unauthorized' });
                return;
            }

            const result = await this.gameService.getUserGames(userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // GET /api/games - Tutte le partite (con filtro)
    async getAllGames(req: Request, res: Response): Promise<void> {
        try {
            const { status } = req.query;

            if (status === 'active') {
                const result = await this.gameService.getActiveGames();
                res.status(200).json(result);
            } else {
                res.status(200).json({
                    success: true,
                    message: 'Use /api/games/active for active games or /api/games/my-games for user games'
                });
            }
        } catch (error) {
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // Metodo per combinare i middleware
    static getMiddlewares() {
        return {
            auth: authMiddleware,
            isGameOwner: (controller: GameController) =>
                (req: AuthenticatedRequest, res: Response, next: Function) =>
                    controller.isGameOwner(req, res, next),
            isGameActive: (controller: GameController) =>
                (req: AuthenticatedRequest, res: Response, next: Function) =>
                    controller.isGameActive(req, res, next),
            isGameStarted: (controller: GameController) =>
                (req: AuthenticatedRequest, res: Response, next: Function) =>
                    controller.isGameStarted(req, res, next)
        };
    }

    async checkWinning(req: Request, res: Response) {

        // 1. Validazione dei Parametri
        const gameId = parseInt(req.params.gameId, 10);
        const cardId = parseInt(req.params.cardId, 10);

        if (isNaN(gameId) || gameId <= 0 || isNaN(cardId) || cardId <= 0) {
            return res.status(400).json({
                message: 'Game ID e Card ID devono essere numeri interi positivi validi.'
            });
        }

        try {
            // 2. Chiamata alla logica di business nel GameService
            const winLevel: WinLevel = await this.gameService.checkWinningForGame(gameId, cardId);

            // 3. Risposta
            // La risposta restituisce un oggetto che include il livello di vincita
            // e un messaggio descrittivo.

            let winDescription: string;

            switch (winLevel) {
                case WinLevel.TOMBOLA:
                    winDescription = 'TOMBOLA!';
                    break;
                case WinLevel.CINQUINA:
                    winDescription = 'Cinquina';
                    break;
                case WinLevel.QUATERNA:
                    winDescription = 'Quaterna';
                    break;
                case WinLevel.TERNO:
                    winDescription = 'Terno';
                    break;
                case WinLevel.AMBO:
                    winDescription = 'Ambo';
                    break;
                default:
                    winDescription = 'Nessuna Vincita Rilevata';
                    break;
            }

            return res.status(200).json({
                gameId: gameId,
                cardId: cardId,
                winLevel: winLevel,
                winDescription: winDescription,
                message: `Verifica completata. Livello massimo raggiunto: ${winDescription}`
            });

        } catch (error) {
            console.error(`Errore durante la verifica della vincita per Game ${gameId} / Card ${cardId}:`, error);

            // Gestione di errori specifici (es. Partita non trovata)
            if (error instanceof Error && error.message.includes('GameStatus not found')) {
                return res.status(404).json({ message: `Partita con ID ${gameId} non trovata.` });
            }

            return res.status(500).json({ message: 'Errore interno del server durante la valutazione della vincita.' });
        }
    }
}