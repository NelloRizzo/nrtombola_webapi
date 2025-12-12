import { CardService, CardServiceInstance } from "../services/CardService";

export class CardController {
    private cardService: CardService = CardServiceInstance;
}