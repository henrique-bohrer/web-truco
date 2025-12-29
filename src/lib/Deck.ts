import { Suit, Rank } from './types';
import { Card } from './Card';

export class Deck {
    private cards: Card[] = [];

    constructor() {
        this.initialize();
    }

    initialize(): void {
        this.cards = [];
        const suits = [Suit.Diamonds, Suit.Spades, Suit.Hearts, Suit.Clubs];
        const ranks = [
            Rank.Four, Rank.Five, Rank.Six, Rank.Seven,
            Rank.Queen, Rank.Jack, Rank.King, Rank.Ace,
            Rank.Two, Rank.Three
        ];

        for (const suit of suits) {
            for (const rank of ranks) {
                this.cards.push(new Card(suit, rank));
            }
        }
    }

    shuffle(): void {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal(count: number): Card[] {
        if (count > this.cards.length) {
            throw new Error('Not enough cards in deck');
        }
        return this.cards.splice(0, count);
    }

    dealOne(): Card {
        const card = this.cards.pop();
        if (!card) {
            throw new Error('Deck is empty');
        }
        return card;
    }

    get remaining(): number {
        return this.cards.length;
    }
}
