// src/services/CardService.ts

import { Card } from '../entities/Card';
// Importiamo l'istanza del repository che abbiamo creato, non la classe
import { CardRepositoryInstance } from '../repositories/CardRepository';

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
     * Recupera tutte le cartelle il cui nome contiene una specifica stringa di ricerca.
     * Usa la clausola LIKE di PostgreSQL.
     * @param searchText La stringa da cercare nel campo 'name'.
     * @returns Una Promise che risolve in un array di Card corrispondenti.
     */
    async searchCardsByName(searchText: string): Promise<Card[]> {
        if (!searchText || searchText.length < 2) {
            // Optional: Se la stringa è troppo corta, potresti voler restituire un array vuoto
            // o lanciare un errore per prevenire query troppo generiche.
            return [];
        }
        return await this.cardRepository.searchByName(searchText);
    }
}

// Esportiamo un'istanza singola del servizio per l'uso in tutta l'applicazione (Singleton)
export const CardServiceInstance = new CardService();