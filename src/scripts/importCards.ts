// importCards.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { XMLParser } from 'fast-xml-parser';
import { Card } from '../entities/Card';
import { AppDataSource } from '../config/database';
import { CardRepositoryInstance } from '../repositories/CardRepository';

// =====================================================================
// ✅ PERCORSO FILE AGGIUSTATO
// =====================================================================
// Risolve il percorso del file tombola.cards all'interno della cartella 'data'
// relativa alla directory in cui si trova questo script.
const CARDS_FILE_PATH = path.join(__dirname, 'data', 'tombola.cards');

/**
 * Funzione per l'importazione delle cartelle dal file XML.
 */
export async function importCards() {
    console.log('Avvio script di importazione cartelle Tombola...');

    try {
        // 1. Connessione al database
        await AppDataSource.initialize();
        console.log('Connessione al database PostgreSQL stabilita.');

        const cardRepository = CardRepositoryInstance;

        // 2. Controllo e pulizia tabella (opzionale: solo la prima volta)
        const countBefore = await cardRepository.count();
        if (countBefore > 0) {
            console.log(`ATTENZIONE: Trovate ${countBefore} cartelle esistenti. Pulizia in corso...`);
            // await cardRepository.clear();
        }

        // 3. Lettura del file XML
        const xmlData = fs.readFileSync(CARDS_FILE_PATH, 'utf8');
        console.log(`File XML letto da: ${CARDS_FILE_PATH}`);

        // 4. Configurazione e parsing XML
        const parser = new XMLParser({
            // Rimuove gli attributi come i:type="..."
            ignoreAttributes: true,
            // Assicura che gli elementi Card siano sempre trattati come array
            isArray: (tagName) => tagName === 'Card',
            removeNSPrefix: true
        });

        const json = parser.parse(xmlData);

        // La struttura dati grezza in base al tuo XML
        // { 'Card': { 'Card': [ { 'Version': '1.0', 'Name': '...', 'Cells': { 'int': [5, 23, ...] } } ] } }
        const rawCards = json.Card[0].Card;
        
        if (!rawCards || rawCards.length === 0) {
            throw new Error('Impossibile trovare l\'array di cartelle nel file XML.');
        }

        console.log(`Trovate ${rawCards.length} cartelle da importare.`);

        // 5. Mappatura e salvataggio dei dati in transazione
        const cardsToSave: Card[] = rawCards.map((rawCard: any) => {
            const card = new Card();

            // Assicurati di accedere correttamente ai campi Name e Version
            card.name = rawCard.Name;
            card.version = rawCard.Version;

            // L'array di numeri è annidato sotto 'Cells' e 'int' (risolto dal tagnameProcessor)
            // 'int' sarà l'array dei numeri.
            if (!rawCard.Cells || !rawCard.Cells.int) {
                console.warn(`Cartella saltata per mancanza di dati Cells: ${rawCard.Name}`);
                return null;
            }

            // Filtra per eliminare null se qualche cartella è stata saltata
            card.cells = rawCard.Cells.int;

            // Assicurati che l'array abbia esattamente 15 numeri come previsto
            if (card.cells.length !== 15) {
                console.warn(`ATTENZIONE: Cartella ${card.name} ha ${card.cells.length} numeri, attesi 15.`);
            }

            return card;
        }).filter((c: Card) => c !== null); // Rimuovi le cartelle nulle

        // Salvataggio massivo in un'unica operazione
        await cardRepository.saveMany(cardsToSave);

        console.log(`✅ Importazione completata. Salvate ${cardsToSave.length} nuove cartelle.`);

    } catch (error) {
        console.error('❌ Errore critico durante l\'importazione:', error);
        process.exit(1);
    } finally {
        // Disconnessione dal database
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}