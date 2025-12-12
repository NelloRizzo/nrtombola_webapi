// src/entities/Card.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';
import { Base } from './Base';

/**
 * Rappresenta una singola Cartella (Tombola Card) con i suoi 15 numeri.
 * Le cartelle sono entità fisse che verranno caricate una sola volta
 * e associate a una sessione di gioco.
 */
@Entity('cards')
export class Card extends Base {
    /**
     * Nome identificativo della cartella (es. "Tombolata 2025 [ S. 1] <n. 1>").
     */
    @Column({ length: 255 })
    name!: string;

    /**
     * Versione del formato della cartella (es. "1.0").
     */
    @Column({ length: 50 })
    version!: string;

    /**
     * Array contenente i 15 numeri della cartella.
     * Mappato a un tipo di array di interi in PostgreSQL (integer[]).
     * * Il decoratore @Index('gin') è opzionale ma altamente consigliato
     * se dovrai fare ricerche efficienti (ad esempio: "trova tutte le
     * cartelle che contengono il numero 42").
     */
    @Index('gin_cells', { synchronize: false }) // Consigliato per query veloci su array
    @Column('integer', { array: true })
    cells!: number[];
}