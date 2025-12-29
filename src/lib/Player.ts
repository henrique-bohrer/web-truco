import { IPlayer, PlayerType, ICard } from './types';

export class Player implements IPlayer {
    public hand: ICard[] = [];

    constructor(public name: string, public type: PlayerType) {}

    playCard(index: number): ICard | null {
        if (index < 0 || index >= this.hand.length) {
            return null;
        }
        return this.hand.splice(index, 1)[0];
    }

    receiveCards(cards: ICard[]) {
        this.hand.push(...cards);
    }

    clearHand() {
        this.hand = [];
    }
}
