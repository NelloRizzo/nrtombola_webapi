// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../services/AuthService';

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: number;
        email: string;
        name: string;
    };
}

// Sostituisci authMiddleware con questa versione debug:
export const authMiddleware = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({ success: false, error: 'No token provided' });
            return;
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({ success: false, error: 'Invalid token format' });
            return;
        }

        const jwtSecret = process.env.JWT_SECRET || 'default-dev-secret-change-in-production';

        try {
            const decoded = jwt.verify(token, jwtSecret) as any;

            req.user = {
                userId: decoded.userId,
                email: decoded.email,
                name: decoded.name
            };

            next();
        } catch (jwtError) {
            res.status(401).json({
                success: false,
                error: 'Invalid token',
                jwtError: jwtError instanceof Error ? jwtError.message : 'Unknown'
            });
            return;
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Authentication failed',
            details: error instanceof Error ? error.message : 'Unknown'
        });
    }
};

// Middleware per verificare ruolo specifico
// In roleMiddleware, aggiungi debug:
export const roleMiddleware = (requiredRole: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Authentication required' });
            return;
        }

        const authService = new AuthService();

        const roleCheck = await authService.isUserInRole(req.user.userId, requiredRole);

        if (!roleCheck.success) {
            res.status(500).json(roleCheck);
            return;
        }

        if (!roleCheck.hasRole) {
            res.status(403).json({
                success: false,
                error: `Requires ${requiredRole} role`,
                userId: req.user.userId,
                hasRole: false
            });
            return;
        }

        next();
    };
};

// Middleware combinato auth + role
export const authWithRole = (requiredRole: string) => {
    return [
        roleMiddleware(requiredRole),
        authMiddleware
    ];
};

// Middleware per verificare se l'utente è il proprietario della risorsa
export const ownerMiddleware = (resourceOwnerIdGetter: (req: Request) => number | string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Authentication required' });
            return;
        }

        const resourceOwnerId = resourceOwnerIdGetter(req);

        if (req.user.userId !== Number(resourceOwnerId)) {
            res.status(403).json({
                success: false,
                error: 'Access denied - not resource owner'
            });
            return;
        }

        next();
    };
};

// Esempio di uso nei controller:
export const gameOwnerMiddleware = ownerMiddleware(
    (req: Request) => parseInt(req.params.gameId)
);