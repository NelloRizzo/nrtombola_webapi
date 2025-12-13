// src/utils/cardImporter.ts
import { XMLParser } from 'fast-xml-parser';
import { Card } from '../entities/Card';

/**
 * Parsa il contenuto XML grezzo (stringa) e lo trasforma in un array di entità Card.
 * Non gestisce I/O, connessioni DB o file system.
 * @param xmlData Contenuto del file tombola.cards come stringa.
 * @returns Array di entità Card pronte per il salvataggio.
 */
export function parseCardsFromXml(xmlData: string): Card[] {

    // 1. Configurazione e parsing XML
    const parser = new XMLParser({
        ignoreAttributes: true,
        // Assicura che gli elementi Card siano sempre trattati come array
        isArray: (tagName) => tagName === 'Card',
        removeNSPrefix: true
    });

    const json = parser.parse(xmlData);

    // La struttura dati grezza in base al tuo XML (aggiustata leggermente per sicurezza)
    const rawCards = json?.Card?.[0]?.Card;

    if (!rawCards || rawCards.length === 0) {
        // Se non trova l'array, ritorna un array vuoto
        return [];
    }

    // 2. Mappatura dei dati in entità Card
    const cardsToSave: Card[] = rawCards.map((rawCard: any) => {
        const card = new Card();

        card.name = rawCard.Name;
        card.version = rawCard.Version;

        if (!rawCard.Cells || !rawCard.Cells.int) {
            console.warn(`Cartella saltata per mancanza di dati Cells: ${rawCard.Name}`);
            return null;
        }

        card.cells = rawCard.Cells.int;

        if (card.cells.length !== 15) {
            console.warn(`ATTENZIONE: Cartella ${card.name} ha ${card.cells.length} numeri, attesi 15.`);
        }

        return card;
    }).filter((c: Card | null): c is Card => c !== null); // Filtra e tipizza correttamente

    return cardsToSave;
}