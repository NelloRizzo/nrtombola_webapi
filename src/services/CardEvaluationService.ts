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
    public static evaluateMaxWin(card: Card, drawnNumbers: number[]): number {
        
        // Convertiamo l'array dei numeri estratti in un set per un lookup O(1) velocissimo
        const drawnSet = new Set(drawnNumbers);
        
        // 1. Tombola check (Vincita massima)
        let matchedCount = 0;
        
        // Contiamo quanti numeri della cartella sono stati estratti
        for (const cellNumber of card.cells) {
            if (drawnSet.has(cellNumber)) {
                matchedCount++;
            }
        }

        // Se tutti e 15 i numeri sono stati estratti: TOMBOLA!
        if (matchedCount === 15) {
            return WinLevel.TOMBOLA; 
        }

        // Se non è stata estratta nemmeno una cella, la vincita massima è 0
        if (matchedCount < 2) {
            return WinLevel.NONE;
        }

        // 2. Controllo Ambo, Terno, Quaterna, Cinquina (per riga)
        // La cartella è composta da 15 numeri nell'ordine di stampa (riga 1, riga 2, riga 3)
        // I numeri estratti finora (matchedCount) sono almeno 2.

        let maxRowMatch = 0; // Tiene traccia della vincita massima su una riga (2, 3, 4, o 5)

        // Itera attraverso le 3 righe (Row 0: 0-4, Row 1: 5-9, Row 2: 10-14)
        for (let i = 0; i < 3; i++) {
            let currentRowMatch = 0;
            const startIndex = i * 5; // 0, 5, 10

            // Itera sui 5 numeri di questa riga
            for (let j = 0; j < 5; j++) {
                const cellNumber = card.cells[startIndex + j];

                if (drawnSet.has(cellNumber)) {
                    currentRowMatch++;
                }
            }

            // Aggiorna la vincita massima raggiunta su una singola riga
            if (currentRowMatch > maxRowMatch) {
                maxRowMatch = currentRowMatch;
            }
        }
        
        // 3. Restituzione del Livello di Vincita
        // Il risultato è il max(matchedCount_sulla_riga, 0)
        
        // La vincita massima su una riga può essere 5 (Cinquina)
        if (maxRowMatch >= WinLevel.CINQUINA) {
            return WinLevel.CINQUINA;
        }
        // Quaterna
        if (maxRowMatch >= WinLevel.QUATERNA) {
            return WinLevel.QUATERNA;
        }
        // Terno
        if (maxRowMatch >= WinLevel.TERNO) {
            return WinLevel.TERNO;
        }
        // Ambo
        if (maxRowMatch >= WinLevel.AMBO) {
            return WinLevel.AMBO;
        }

        // Se non è Tombola e la vincita massima su una riga è 0 o 1
        return WinLevel.NONE; // 0 o 1 non sono considerate vincite valide (solo Ambo+)
    }
}