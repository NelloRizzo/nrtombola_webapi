// src/app.ts
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { AppDataSource } from './config/database';
import { AuthController } from './controllers/AuthController';
import { GameController } from './controllers/GameController';
import { AuthenticatedRequest, authMiddleware, authWithRole } from './middleware/AuthMiddleware';
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { CardController } from './controllers/CardController';
import multer from 'multer';

dotenv.config();

// =========================================================================
// 🟢 CONFIGURAZIONE MULTER
// =========================================================================

// Usiamo memoryStorage perché il file è piccolo (XML/Cards) e vogliamo il contenuto
// (buffer) direttamente in req.file.buffer per passarlo al CardService.
const upload = multer({ 
    storage: multer.memoryStorage(),
    // Opzionale: limita la dimensione del file, es. 5MB
    // limits: { fileSize: 5 * 1024 * 1024 } 
});

class App {
    private app: express.Application;
    private port: number;

    constructor() {
        this.app = express();
        this.port = parseInt(process.env.PORT || '3000');
        this.config();
        this.connectDatabase();
        this.routes();
    }

    private config(): void {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    private async connectDatabase(): Promise<void> {
        try {
            await AppDataSource.initialize();
        } catch (error) {
            console.error('Database connection error:', error);
            process.exit(1);
        }
    }

    private routes(): void {
        const router = express.Router();
        const authController = new AuthController();
        const gameController = new GameController();
        const cardController = new CardController();

        // Auth routes (pubbliche)
        router.post('/auth/register', (req, res) => authController.register(req, res));
        router.post('/auth/login', (req, res) => authController.login(req, res));
        router.post('/auth/logout', (req, res) => authController.logout(req, res));
        router.get('/auth/verify', authMiddleware, (req, res) => authController.verifyToken(req, res));
        router.get('/auth/me', authMiddleware, (req, res) => authController.getCurrentUser(req, res));

        // User role management (solo admin/caller)
        router.post('/users/:userId/roles', authWithRole('admin'), (req: express.Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: express.Response<any, Record<string, any>>) =>
            authController.addUserToRole(req, res));
        router.delete('/users/:userId/roles/:roleName', authWithRole('admin'), (req: express.Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>, res: express.Response<any, Record<string, any>>) =>
            authController.removeUserFromRole(req, res));
        router.get('/users/:userId/roles/:roleName', authMiddleware, (req, res) =>
            authController.checkUserRole(req, res));

        const { auth, isGameOwner, isGameActive, isGameStarted } = GameController.getMiddlewares();

        // Game routes con middleware
        router.post('/games',
            authWithRole('caller'),
            (req: AuthenticatedRequest, res: express.Response<any, Record<string, any>>) => gameController.createGame(req as AuthenticatedRequest, res)
        );

        router.get('/games', (req, res) => gameController.getAllGames(req, res));
        router.get('/games/active', (req, res) => gameController.getActiveGames(req, res));

        router.get('/games/my-games',
            auth,
            (req, res) => gameController.getUserGames(req as AuthenticatedRequest, res)
        );

        // Game actions con multiple middleware
        router.post('/games/:gameId/start',
            auth,
            (req, res, next) => isGameOwner(gameController)(req as AuthenticatedRequest, res, next),
            (req, res) => gameController.startGame(req as AuthenticatedRequest, res)
        );

        router.post('/games/:gameId/end',
            auth,
            (req, res, next) => isGameOwner(gameController)(req as AuthenticatedRequest, res, next),
            (req, res) => gameController.endGame(req as AuthenticatedRequest, res)
        );

        router.post('/games/:gameId/draw',
            auth,
            (req, res, next) => isGameOwner(gameController)(req as AuthenticatedRequest, res, next),
            (req, res, next) => isGameStarted(gameController)(req as AuthenticatedRequest, res, next),
            (req, res) => gameController.drawNumber(req as AuthenticatedRequest, res)
        );

        router.post('/games/:gameId/draw/random',
            auth,
            (req, res, next) => isGameOwner(gameController)(req as AuthenticatedRequest, res, next),
            (req, res, next) => isGameStarted(gameController)(req as AuthenticatedRequest, res, next),
            (req, res) => gameController.drawRandomNumber(req as AuthenticatedRequest, res)
        );

        // Game info (pubbliche)
        router.get('/games/:gameId/numbers', (req, res) =>
            gameController.getCalledNumbers(req, res));

        router.get('/games/:gameId/numbers/latest', (req, res) =>
            gameController.getLatestNumbers(req, res));

        router.get('/games/:gameId/status', (req, res) =>
            gameController.getGameStatus(req, res));

        // Controllo vincite
        router.get('/games/:gameId/card/:cardId', (req, res) => gameController.checkWinning(req, res));

        // Elenco cartelle
        router.get('/cards/', (req, res) => cardController.getPaginatedCards(req, res))
        // POST /api/cards/upload
        // Il middleware 'upload.single('cardsFile')' gestirà l'upload di un singolo file
        // con il nome di campo 'cardsFile' e lo renderà disponibile in req.file.buffer
        router.post(
            '/cards/upload',
            upload.single('cardsFile'),
            cardController.uploadCards
        );
        this.app.use('/api', router);
    }

    public start(): void {
        this.app.listen(this.port, () => {
            console.log(`Server running on port ${this.port}`);
        });
    }
}

// Avvio applicazione
const app = new App();
app.start();