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

    /**
     * Recupera le cartelle con supporto per la paginazione e la ricerca per nome.
     * Utilizza il Query Builder per ottimizzare le query di conteggio e recupero dati.
     * * @param take Il numero massimo di risultati per pagina (limite).
     * @param skip Il numero di risultati da saltare (offset).
     * @param searchTerm La stringa da cercare nel campo 'name' (opzionale).
     * @returns Una Promise che risolve in una tupla [data: Card[], total: number].
     */
    async findPaginatedAndCount(
        take: number,
        skip: number,
        searchTerm?: string
    ): Promise<[Card[], number]> {

        // 1. Inizializza il Query Builder
        const queryBuilder = this.repository.createQueryBuilder('card')
            // Ordina per id per garantire un risultato coerente
            .orderBy('card.id', 'ASC');

        // 2. Applicare la clausola di ricerca se searchTerm è fornito
        if (searchTerm) {
            // NOTA: Usiamo LOWER() e ILIKE/LIKE per una ricerca case-insensitive (dipende dal DB)
            // Se usi PostgreSQL, ILIKE è ideale; altrimenti, usa LIKE con LOWER().
            const searchPattern = `%${searchTerm.toLowerCase()}%`;

            queryBuilder.where('LOWER(card.name) LIKE :search', { search: searchPattern });
        }

        // 3. Eseguire il conteggio totale dei risultati filtrati (senza paginazione)
        // Questa è la chiave per sapere quante pagine totali ci sono.
        const total = await queryBuilder.getCount();

        // 4. Applicare la paginazione (skip/take) solo alla query di recupero dati
        queryBuilder
            .skip(skip)
            .take(take);

        // 5. Eseguire la query di recupero dati
        const data = await queryBuilder.getMany();

        // 6. Restituire i risultati
        return [data, total];
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

