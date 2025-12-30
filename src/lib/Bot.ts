import { Player } from './Player';
import { PlayerType, Rank, ICard } from './types';

export interface GameStateView {
    vira: Rank;
    roundCards: { playerIndex: number, card: ICard }[]; // Cards played in current round
    handScores: number[]; // Scores for the current hand (e.g. [1, 0] means team 0 won 1 round)
    // could add more info like total scores, who played what previously
}

export class Bot extends Player {
    constructor(name: string) {
        super(name, PlayerType.Bot);
    }

    // A simple decision making process
    // Returns the index of the card to play
    decideMove(gameState: GameStateView): number {
        const myCards = this.hand;
        if (myCards.length === 0) return -1; // Should not happen

        // 1. Identify Manilhas in hand
        const manilhas = myCards.filter(c => c.getPower(gameState.vira) >= 100);

        // Simple Logic:
        // If it's my turn and I am the first to play in the round (roundCards is empty or I am starting)
        // Play the lowest card to save high cards? Or play high to pressure?
        // Let's implement: "Play low if lost/early, play high if can win or last round"

        // For now, let's just pick a random card as a very basic placeholder,
        // but we can try to find the highest card to win if needed.

        // Let's implement the logic from README: "Reconhecer manilhas, Jogar cartas baixas se perdido, Aceitar Truco se forte"
        // Since Truco logic is separate (event/action), here we only decide Card to play for now.

        // Find best card
        // Sort hand by power
        const sortedHand = [...this.hand].map((c, i) => ({ card: c, index: i }))
                                         .sort((a, b) => a.card.getPower(gameState.vira) - b.card.getPower(gameState.vira));

        // If I am the last player, check if I can win the round cheaply.
        if (gameState.roundCards.length > 0) {
             // Find the current winning card
             let bestCardSoFar = gameState.roundCards[0].card;
             for(let i=1; i<gameState.roundCards.length; i++) {
                 if (gameState.roundCards[i].card.getPower(gameState.vira) > bestCardSoFar.getPower(gameState.vira)) {
                     bestCardSoFar = gameState.roundCards[i].card;
                 }
             }

             const bestOpponentPower = bestCardSoFar.getPower(gameState.vira);

             // Try to find the lowest card that beats the opponent
             for (const item of sortedHand) {
                 if (item.card.getPower(gameState.vira) > bestOpponentPower) {
                     return item.index;
                 }
             }

             // If cannot beat, play lowest
             return sortedHand[0].index;
        }

        // If I am first or leading
        // Play lowest card? Or Highest?
        // Let's play a medium card or lowest non-manilha to probe.
        // For simplicity: Play lowest.
        return sortedHand[0].index;
    }

    shouldAcceptTruco(gameState: GameStateView): boolean {
        // Logic: Accept if has Manilha or strong cards (3 or 2)
        const strongCards = this.hand.filter(c => {
            const power = c.getPower(gameState.vira);
            // Manilhas (>=100) or 3 (base 9) or 2 (base 8)
            // Note: 3 and 2 are strong only if they are not the "weak" cards compared to Manilha.
            // But usually 3 and 2 are considered strong.
            // Base values: 3 is 9, 2 is 8.
            return power >= 100 || power >= 8;
        });

        return strongCards.length > 0;
    }
}
