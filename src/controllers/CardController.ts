import { Request, Response } from 'express';
import { CardService, CardServiceInstance } from "../services/CardService";

// Dimensioni di default per la paginazione, se non specificate dal frontend
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;

export class CardController {
    private cardService: CardService = CardServiceInstance;

    /**
         * Gestisce la richiesta GET /api/cards.
         * Recupera le cartelle filtrate e paginate.
         * Parametri query attesi: ?page=X&limit=Y&search=Z
         */
    async getPaginatedCards(req: Request, res: Response): Promise<void> {
        // 1. Estrazione e validazione dei parametri dalla query string
        const {
            page: pageQuery,
            limit: limitQuery,
            search: searchQuery
        } = req.query;

        // Conversione in numeri interi con fallback ai valori di default
        const page = parseInt(pageQuery as string) || DEFAULT_PAGE;
        const limit = parseInt(limitQuery as string) || DEFAULT_PAGE_SIZE;

        // La stringa di ricerca, se presente
        const searchTerm = searchQuery as string || undefined;

        try {
            // 2. Chiamata al CardService con i parametri puliti
            const result = await CardServiceInstance.paginateCards(
                page,
                limit,
                searchTerm
            );

            // 3. Risposta di successo al client (status 200 OK)
            // L'oggetto 'result' contiene già data, total, page, pages, limit
            res.status(200).json(result);

        } catch (error) {
            console.error('Errore nel recupero delle cartelle paginate:', error);

            // 4. Risposta di errore al client (status 500 Internal Server Error)
            res.status(500).json({
                success: false,
                error: 'Impossibile recuperare l\'elenco delle cartelle.'
            });
        }
    }
}