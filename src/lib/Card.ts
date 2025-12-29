import { Suit, Rank, ICard } from './types';

export class Card implements ICard {
    constructor(public suit: Suit, public rank: Rank) {}

    toString(): string {
        return `${this.rank}${this.suit}`;
    }

    // Helper to get base value of a card
    private getBaseValue(): number {
        const order = [
            Rank.Four, Rank.Five, Rank.Six, Rank.Seven,
            Rank.Queen, Rank.Jack, Rank.King, Rank.Ace,
            Rank.Two, Rank.Three
        ];
        return order.indexOf(this.rank);
    }

    // Calculate power considering the Vira
    getPower(vira: Rank): number {
        const order = [
            Rank.Four, Rank.Five, Rank.Six, Rank.Seven,
            Rank.Queen, Rank.Jack, Rank.King, Rank.Ace,
            Rank.Two, Rank.Three
        ];

        const viraIndex = order.indexOf(vira);
        // Manilha is the next card in circular order
        const manilhaIndex = (viraIndex + 1) % order.length;
        const manilhaRank = order[manilhaIndex];

        if (this.rank === manilhaRank) {
            // It is a Manilha. Power depends on suit.
            // Base power for Manilha starts at 100 to beat any normal card (max base is 9)
            // Order: Diamonds < Spades < Hearts < Clubs
            const suitPower: { [key in Suit]: number } = {
                [Suit.Diamonds]: 1,
                [Suit.Spades]: 2,
                [Suit.Hearts]: 3,
                [Suit.Clubs]: 4
            };
            return 100 + suitPower[this.suit];
        } else {
            // Normal card
            return this.getBaseValue();
        }
    }
}
