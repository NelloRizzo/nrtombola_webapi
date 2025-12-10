// src/controllers/AuthController.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    // POST /api/auth/register
    async register(req: Request, res: Response): Promise<void> {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                res.status(400).json({
                    success: false,
                    error: 'Name, email and password are required'
                });
                return;
            }

            const result = await this.authService.registerUser({
                name,
                email,
                password
            });

            if (result.success) {
                res.status(201).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // POST /api/auth/login
    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    error: 'Email and password are required'
                });
                return;
            }

            const result = await this.authService.login(email, password);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(401).json(result);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // POST /api/auth/logout
    async logout(req: Request, res: Response): Promise<void> {
        try {
            const token = req.headers.authorization?.split(' ')[1] || '';

            const result = await this.authService.logout(token);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // POST /api/users/:userId/roles
    async addUserToRole(req: Request, res: Response): Promise<void> {
        try {
            const userId = parseInt(req.params.userId);
            const { roleName } = req.body;

            if (!roleName) {
                res.status(400).json({
                    success: false,
                    error: 'roleName is required'
                });
                return;
            }

            const result = await this.authService.addUserToRole(userId, roleName);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // DELETE /api/users/:userId/roles/:roleName
    async removeUserFromRole(req: Request, res: Response): Promise<void> {
        try {
            const userId = parseInt(req.params.userId);
            const roleName = req.params.roleName;

            const result = await this.authService.removeUserFromRole(userId, roleName);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // GET /api/users/:userId/roles/:roleName
    async checkUserRole(req: Request, res: Response): Promise<void> {
        try {
            const userId = parseInt(req.params.userId);
            const roleName = req.params.roleName;

            const result = await this.authService.isUserInRole(userId, roleName);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // GET /api/auth/verify
    async verifyToken(req: Request, res: Response): Promise<void> {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                res.status(401).json({
                    success: false,
                    error: 'No token provided'
                });
                return;
            }

            const result = await this.authService.verifyToken(token);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(401).json(result);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    // GET /api/auth/me
    async getCurrentUser(req: Request, res: Response): Promise<void> {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                res.status(401).json({
                    success: false,
                    error: 'No token provided'
                });
                return;
            }

            const result = await this.authService.verifyToken(token);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(401).json(result);
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}