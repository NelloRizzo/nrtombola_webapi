// src/services/CardEvaluationService.ts

import { Card } from '../entities/Card';

/**
 * Mappatura dei valori di vincita (ad esempio, per un'enumerazione o costanti)
 * L'esercizio richiede di restituire un intero (0-15), dove il valore è:
 * 1-5: Quanti numeri sono stati trovati su una riga (Ambo, Terno, Quaterna, Cinquina)
 * 15: Tombola (tutti i numeri)
 * 0: Nessuna vincita
 */
export enum WinLevel {
    NONE = 0,
    AMBO = 2,
    TERNO = 3,
    QUATERNA = 4,
    CINQUINA = 5,
    TOMBOLA = 15 // Tutti i 15 numeri estratti
}


/**
 * Classe di servizio per valutare lo stato di una singola cartella in base ai numeri estratti.
 */
export class CardEvaluationService {

    /**
     * Calcola la vincita massima ottenuta su una cartella dato l'elenco dei numeri estratti.
     * * La cartella viene divisa in 3 righe da 5 numeri ciascuna.
     * La vincita massima è il maggior numero di match trovati su una singola riga (2-5), 
     * oppure 15 se tutti i numeri sono presenti.
     * * @param card La Card entity con l'array 'cells' di 15 numeri.
     * @param drawnNumbers L'array di tutti i numeri estratti finora.
     * @returns Il livello di vincita massimo raggiunto (0, 2, 3, 4, 5, 15).
     */
    public static evaluateMaxWin(card: Card, drawnNumbers: number[]): WinLevel {
        // Convertiamo l'array dei numeri estratti in un set per un lookup O(1) velocissimo
        const drawnSet = new Set(drawnNumbers);

        // 2. Suddivisione della Cartella in Righe (3 righe da 5 numeri)
        const rows: number[][] = [];
        for (let i = 0; i < 15; i += 5) {
            rows.push(card.cells.slice(i, i + 5));
        }

        // 3. Logica di Verifica
        let maxRowMatch = 0; // Massimo match (Ambo=2, Terno=3, Cinquina=5)
        let totalMatchedNumbers = 0; // Totale match su tutta la cartella (per la Tombola)
        
        // Verifica Cinquina (maxRowMatch)
        for (const row of rows) {
            let rowMatchCount = 0;
            for (const cellNumber of row) {
                if (drawnSet.has(cellNumber)) {
                    rowMatchCount++;
                }
            }
            maxRowMatch = Math.max(maxRowMatch, rowMatchCount);
            totalMatchedNumbers += rowMatchCount;
        }

        // 4. Determinazione del Livello di Vincita e Messaggio
        return (totalMatchedNumbers === 15) ? 15 : maxRowMatch;
    }
}