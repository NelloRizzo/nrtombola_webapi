import { NextFunction, Request, Response } from 'express';
import { CardService, CardServiceInstance } from "../services/CardService";

// Dimensioni di default per la paginazione, se non specificate dal frontend
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;

export class CardController {
    private cardService: CardService = CardServiceInstance;
    async uploadCards(req: Request, res: Response, next: NextFunction) {

        // Verifica se il file è stato caricato dal middleware (p. es. Multer)
        if (!req.file || !req.file.buffer) {
            return res.status(400).send({ message: 'Nessun file di cartelle caricato.' });
        }

        try {
            // Converti il buffer del file in stringa per il parser XML
            const fileContent = req.file.buffer.toString('utf8');

            // Controlla se l'utente ha richiesto la pulizia (es. da un campo form)
            const clearExisting = req.body.clearExisting === 'true';

            const savedCount = await CardServiceInstance.importCardsFromFile(
                fileContent,
                clearExisting
            );

            res.status(200).send({
                message: `✅ Importazione completata. Salvate ${savedCount} cartelle.`,
                count: savedCount,
            });

        } catch (error) {
            console.error('Errore durante l\'upload e l\'importazione:', error);
            res.status(500).send({ message: 'Errore interno del server durante l\'importazione.' });
        }
    }

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