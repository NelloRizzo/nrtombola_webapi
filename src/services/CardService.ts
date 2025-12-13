// src/services/CardService.ts

import { Card } from '../entities/Card';
// Importiamo l'istanza del repository che abbiamo creato, non la classe
import { CardRepositoryInstance } from '../repositories/CardRepository';
import { parseCardsFromXml } from '../utils/cardImporter';

// --- Tipi di Dati: Necessari per la risposta paginata al frontend ---
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    pages: number;
    limit: number;
}
// -------------------------------------------------------------------

/**
 * Servizio dedicato alla gestione e recupero delle entità Card.
 * Incapsula la logica di accesso ai dati e business routing.
 */
export class CardService {

    private readonly cardRepository = CardRepositoryInstance;

    /**
     * Recupera tutte le cartelle presenti nel database.
     * @returns Una Promise che risolve in un array di tutte le Card.
     */
    async findAllCards(): Promise<Card[]> {
        // Usiamo il metodo findAll() ereditato dal BaseRepository
        return await this.cardRepository.findAll();
    }

    /**
     * Recupera una singola cartella tramite il suo ID.
     * @param id L'ID della cartella da recuperare.
     * @returns Una Promise che risolve nella Card trovata o null se non esiste.
     */
    async findCardById(id: number): Promise<Card | null> {
        // Usiamo il metodo findById(id) ereditato dal BaseRepository
        return await this.cardRepository.findById(id);
    }

    /**
     * Recupera le cartelle con supporto per paginazione e ricerca per nome.
     * * NOTA: Affinché il filtro `searchTerm` funzioni correttamente, è necessario
     * che il tuo CardRepository abbia un metodo come `findPaginatedAndCount` 
     * implementato con il QueryBuilder di TypeORM.
     * * @param page La pagina richiesta (basata su 1).
     * @param limit Il numero massimo di risultati per pagina.
     * @param searchTerm La stringa da cercare nel campo 'name' (opzionale).
     * @returns Una Promise che risolve in un oggetto PaginatedResult di Card.
     */
    async paginateCards(
        page: number,
        limit: number,
        searchTerm?: string
    ): Promise<PaginatedResult<Card>> {

        const pageNum = Math.max(1, page);
        const limitNum = Math.max(1, limit);
        const skip = (pageNum - 1) * limitNum;

        const [data, total] = await this.cardRepository.findPaginatedAndCount(
            limitNum,
            skip,
            searchTerm
        );

        const totalPages = Math.ceil(total / limitNum);

        return {
            data: data as Card[],
            total: total,
            page: pageNum,
            pages: totalPages,
            limit: limitNum,
        };
    }

    /**
      * Gestisce l'upload del file XML, parsa il contenuto e salva le cartelle nel DB.
      * @param fileContent Contenuto del file XML caricato come stringa.
      * @param clearExisting Se TRUE, svuota la tabella prima di importare.
      * @returns Numero di cartelle salvate.
      */
    async importCardsFromFile(fileContent: string, clearExisting: boolean = false): Promise<number> {

        if (clearExisting) {
            console.log('Pulizia tabella Card in corso...');
            await this.cardRepository.clear();
        }

        // 1. Parsa il contenuto XML
        const cardsToSave: Card[] = parseCardsFromXml(fileContent);

        if (cardsToSave.length === 0) {
            throw new Error('Nessuna cartella valida trovata nel file caricato. Verifica la struttura XML.');
        }

        // 2. Salva le nuove cartelle
        await this.cardRepository.saveMany(cardsToSave);

        return cardsToSave.length;
    }

}

// Esportiamo un'istanza singola del servizio per l'uso in tutta l'applicazione (Singleton)
export const CardServiceInstance = new CardService();