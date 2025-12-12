// src/repositories/Card.repository.ts

import { DataSource, DeepPartial, In, Repository } from 'typeorm';
import { Card } from '../entities/Card';
import { BaseRepository } from './BaseRepository';

// ⚠️ Adatta questo import al tuo file di inizializzazione del DataSource
import { AppDataSource } from '../config/database';

/**
 * Repository dedicato per l'entità Card, estende il BaseRepository.
 * Contiene la logica di business specifica per la gestione delle cartelle.
 */
export class CardRepository extends BaseRepository<Card> {

    // Il costruttore chiama il costruttore della classe base (BaseRepository)
    constructor(repository: Repository<Card>) {
        super(repository);
    }

    /**
     * Trova tutte le cartelle che contengono uno specifico numero estratto.
     * Utilizza la potente clausola ANY di PostgreSQL per cercare negli array.
     * @param drawnNumber Il numero estratto da cercare nelle celle.
     * @returns Un array di entità Card.
     */
    async findCardsByNumber(drawnNumber: number): Promise<Card[]> {
        // Usiamo query builder per sfruttare le funzioni array di PostgreSQL in modo sicuro
        const cards = await this.repository
            .createQueryBuilder('card')
            // 'ANY(card.cells)' verifica se il drawnNumber è presente nell'array 'cells'
            .where(':drawnNumber = ANY(card.cells)', { drawnNumber })
            .getMany();

        return cards;
    }

    /**
     * Esegue il salvataggio massivo di un array di entità Card.
     * Utilizza il metodo createMany ereditato dal BaseRepository.
     * @param cards Array di entità Card da salvare.
     * @returns Un array delle entità Card salvate.
     */
    async saveMany(cards: Card[]): Promise<Card[]> {
        // La tua BaseRepository ha già un metodo createMany che gestisce l'array
        // Lo chiamiamo per coerenza, sebbene TypeORM supporti repository.save(array)
        return await this.createMany(cards as DeepPartial<Card>[]);
    }

    /**
     * Trova un insieme di cartelle in base a una lista di ID.
     * @param cardIds Array di ID delle cartelle da recuperare.
     * @returns Un array di entità Card.
     */
    async findByIds(cardIds: number[]): Promise<Card[]> {
        return await this.repository.find({
            where: {
                id: In(cardIds)
            }
        });
    }

    /**
     * Trova tutte le cartelle il cui nome contiene la stringa di ricerca specificata,
     * in modo insensibile alle maiuscole/minuscole (ILIKE in PostgreSQL).
     * @param searchText La stringa da cercare nel campo 'name'.
     * @returns Un array di entità Card corrispondenti.
     */
    async searchByName(searchText: string): Promise<Card[]> {
        if (!searchText || searchText.length < 1) {
            return [];
        }
        
        // Usiamo il QueryBuilder per l'operatore ILIKE di PostgreSQL
        return await this.repository.createQueryBuilder('card')
            // ILIKE esegue una ricerca insensibile alle maiuscole/minuscole
            .where('card.name ILIKE :search', { search: `%${searchText}%` })
            .getMany();
    }
}

// ----------------------------------------------------
// Esportazione dell'istanza del Repository
// ----------------------------------------------------

// ⚠️ Questo è il punto in cui TypeORM è legato al tuo DataSource.
// Usa questo oggetto CardRepositoryInstance nei tuoi servizi.
export const CardRepositoryInstance = new CardRepository(
    AppDataSource.getRepository(Card)
);

