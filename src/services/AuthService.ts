// src/services/AuthService.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { RoleRepository } from '../repositories/RoleRepository';
import { UserRoleRepository } from '../repositories/UserRoleRepository';

export class AuthService {
    private userRepository: UserRepository;
    private roleRepository: RoleRepository;
    private userRoleRepository: UserRoleRepository;
    private jwtSecret: string;

    constructor() {
        this.userRepository = new UserRepository();
        this.roleRepository = new RoleRepository();
        this.userRoleRepository = new UserRoleRepository();
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    }

    async registerUser(data: {
        name: string;
        email: string;
        password: string;
    }): Promise<any> {
        try {
            // Verifica se l'utente esiste già
            const existingUser = await this.userRepository.findByEmail(data.email);
            if (existingUser) {
                return {
                    success: false,
                    error: 'Email already exists'
                };
            }

            // Hash della password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(data.password, saltRounds);

            // Crea l'utente
            const user = await this.userRepository.create({
                name: data.name,
                email: data.email,
                password: hashedPassword
            });

            // Verifica se è il primo utente
            const totalUsers = await this.userRepository.count();

            if (totalUsers === 1) {
                // Primo utente = assegna ruolo admin
                const adminRole = await this.roleRepository.findByName('admin');
                if (adminRole) {
                    await this.userRoleRepository.assignRoleToUser(user.id, adminRole.id);
                }

                // Assicurati che il primo utente abbia anche il ruolo caller
                const callerRole = await this.roleRepository.findByName('caller');
                if (callerRole) {
                    await this.userRoleRepository.assignRoleToUser(user.id, callerRole.id);
                }

                console.log('First user registered - assigned admin and caller roles');
            } else {
                // Utenti successivi = assegna ruolo caller di default
                const callerRole = await this.roleRepository.findByName('caller');
                if (callerRole) {
                    await this.userRoleRepository.assignRoleToUser(user.id, callerRole.id);
                }
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    isFirstUser: totalUsers === 1
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Registration failed'
            };
        }
    }

    async login(email: string, password: string): Promise<any> {
        try {
            // Trova l'utente
            const user = await this.userRepository.findByEmail(email, true);
            if (!user) {
                return {
                    success: false,
                    error: 'Invalid credentials'
                };
            }

            // Verifica password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return {
                    success: false,
                    error: 'Invalid credentials'
                };
            }

            // Aggiorna ultimo login
            await this.userRepository.update(user.id, { lastLogin: new Date() });

            // Genera token JWT
            const token = jwt.sign(
                {
                    userId: user.id,
                    email: user.email,
                    name: user.name
                },
                this.jwtSecret,
                { expiresIn: '24h' }
            );

            return {
                success: true,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    roles: user.roles?.map(role => role.name) || []
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Login failed'
            };
        }
    }

    logout(token: string): Promise<any> {
        // Per JWT stateless, il logout è lato client
        // Puoi implementare una blacklist se necessario
        return Promise.resolve({
            success: true,
            message: 'Logged out successfully'
        });
    }

    async addUserToRole(userId: number, roleName: string): Promise<any> {
        try {
            // Trova il ruolo
            const role = await this.roleRepository.findByName(roleName);
            if (!role) {
                return {
                    success: false,
                    error: 'Role not found'
                };
            }

            // Assegna il ruolo
            const user = await this.userRoleRepository.assignRoleToUser(userId, role.id);

            return {
                success: true,
                message: `Role ${roleName} added to user`,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    roles: user.roles?.map(r => r.name) || []
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to add role'
            };
        }
    }

    async removeUserFromRole(userId: number, roleName: string): Promise<any> {
        try {
            // Trova il ruolo
            const role = await this.roleRepository.findByName(roleName);
            if (!role) {
                return {
                    success: false,
                    error: 'Role not found'
                };
            }

            // Verifica se l'utente esiste
            const user = await this.userRepository.findById(userId);
            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }

            // Rimuovi il ruolo
            const updatedUser = await this.userRoleRepository.removeRoleFromUser(userId, role.id);

            return {
                success: true,
                message: `Role ${roleName} removed from user`,
                user: {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    roles: updatedUser.roles?.map(r => r.name) || []
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to remove role'
            };
        }
    }

    async isUserInRole(userId: number, roleName: string): Promise<any> {
        try {
            const hasRole = await this.userRoleRepository.userHasRole(userId, roleName);

            return {
                success: true,
                hasRole,
                userId,
                roleName
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to check role'
            };
        }
    }

    async verifyToken(token: string): Promise<any> {
        try {
            const decoded = jwt.verify(token, this.jwtSecret) as any;

            // Verifica che l'utente esista ancora
            const user = await this.userRepository.findById(decoded.userId);
            
            if (!user) {
                return {
                    success: false,
                    error: 'User not found'
                };
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Invalid token'
            };
        }
    }
}