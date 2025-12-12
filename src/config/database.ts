import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../entities/User';
import { Role } from '../entities/Role';
import { Game } from '../entities/Game';
import { CalledNumber } from '../entities/CalledNumber';
import { Card } from '../entities/Card';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    synchronize: true, // Solo per sviluppo
    logging: false,
    entities: [User, Role, Game, CalledNumber, Card],
    subscribers: [],
    migrations: []
});