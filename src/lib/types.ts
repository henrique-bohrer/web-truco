export enum Suit {
    Diamonds = '♦️',
    Spades = '♠️',
    Hearts = '♥️',
    Clubs = '♣️'
}

export enum Rank {
    Four = '4',
    Five = '5',
    Six = '6',
    Seven = '7',
    Queen = 'Q',
    Jack = 'J',
    King = 'K',
    Ace = 'A',
    Two = '2',
    Three = '3'
}

export enum PlayerType {
    Human = 'HUMAN',
    Bot = 'BOT'
}

export interface ICard {
    suit: Suit;
    rank: Rank;
    getPower(vira: Rank): number;
    toString(): string;
}

export interface IPlayer {
    name: string;
    type: PlayerType;
    hand: ICard[];
    playCard(index: number): ICard | null;
}
