import { Deck } from './Deck';
import { Player } from './Player';
import { Bot, GameStateView } from './Bot';
import { Rank, ICard } from './types';
import * as readline from 'readline';

export class MatchController {
    private deck: Deck;
    private players: Player[] = [];
    private score: number[] = [0, 0]; // Team 1 vs Team 2
    private roundScore: number[] = [0, 0]; // Rounds won in current hand
    private vira: Rank | null = null;
    private currentTurnIndex: number = 0;
    private trucoValue: number = 1;
    private rl: readline.Interface;

    constructor() {
        this.deck = new Deck();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    addPlayer(player: Player) {
        if (this.players.length < 4) {
            this.players.push(player);
        }
    }

    async startMatch() {
        console.log("Starting Match!");
        while (this.score[0] < 12 && this.score[1] < 12) {
            await this.playHand();
            console.log(`Current Score: Team 1: ${this.score[0]} | Team 2: ${this.score[1]}`);
        }

        if (this.score[0] >= 12) {
            console.log("Team 1 Wins the Match!");
        } else {
            console.log("Team 2 Wins the Match!");
        }
        this.rl.close();
    }

    private async playHand() {
        console.log("\n--- Starting New Hand ---");
        this.deck.initialize();
        this.deck.shuffle();
        this.trucoValue = 1;
        this.roundScore = [0, 0];

        // Deal 3 cards to each player
        for (const player of this.players) {
            player.clearHand();
            player.receiveCards(this.deck.deal(3));
        }

        // Vira
        const viraCard = this.deck.dealOne();
        this.vira = viraCard.rank;
        console.log(`Vira is: ${viraCard.toString()}`);

        let roundNumber = 1;
        let lastWinnerIndex = this.currentTurnIndex; // Whoever won last hand or starts first

        // Mão de Ferro logic check
        if (this.score[0] === 11 && this.score[1] === 11) {
             console.log("!!! MÃO DE FERRO !!! (Cards are blind)");
             // TODO: Implement blindness if needed, for now just normal play
        }

        while (this.roundScore[0] < 2 && this.roundScore[1] < 2) {
            console.log(`\nRound ${roundNumber}`);
            const roundResult = await this.playRound(lastWinnerIndex);

            if (roundResult.type === 'fold') {
                const winningTeam = roundResult.winnerIndex % 2;
                this.roundScore[winningTeam] = 2; // Force win condition
                console.log(`Player ${this.players[roundResult.winnerIndex ^ 1].name} folded! Winner is ${this.players[roundResult.winnerIndex].name}`);
                break;
            }

            const winnerIndex = roundResult.winnerIndex;

            if (winnerIndex === -1) {
                // Draw in round
                console.log("Round Draw!");
                // Rules for draw:
                // 1st round draw: winner of 2nd wins.
                // 2nd round draw: winner of 1st wins.
                // 3rd round draw: winner of 1st wins (or draw if all draw).
                // Simplified: Give point to whoever won previous, or if 1st round, next one decides.
                // For simplified logic: Both get a "round win" marker or specialized logic?
                // Standard Truco Paulista:
                // Empate na 1ª: Quem ganhar a 2ª leva. Empate na 2ª também: Quem ganhar a 3ª leva. Empate na 3ª: Ninguém ganha? Or Team that started?
                // Actually:
                // Empatou 1ª: Ninguém pontua na rodada. Quem ganhar a 2ª leva o tento.
                // Empatou 2ª: Quem ganhou a 1ª leva.
                // Empatou 3ª: Quem ganhou a 1ª leva.
                // Empatou 1ª, 2ª e 3ª: Ninguém ganha? Or distribution hand repeats? Typically rare.

                // Let's implement simplified "Biggest card wins" which handles draw by returning -1.
                // If draw, we need special handling.

                if (roundNumber === 1) {
                    // Draw on first: Mark as special state?
                    // Let's increment both to signal 'tied first'
                    this.roundScore[0] += 1;
                    this.roundScore[1] += 1;
                } else {
                    // Draw on 2nd or 3rd
                    if (this.roundScore[0] > this.roundScore[1]) {
                        // Team 0 led, so they win
                        this.roundScore[0] = 2;
                    } else if (this.roundScore[1] > this.roundScore[0]) {
                        this.roundScore[1] = 2;
                    } else {
                         // Was already tied (1-1 after 1st tied and 2nd tied? Rare)
                         // Or 1st tied (1-1), 2nd tied -> Go to 3rd?
                         // If 1st tied, score is 1-1. 2nd tied -> whoever wins 3rd?
                         // Actually if 1st is tied, the winner of 2nd takes all.
                    }
                }

            } else {
                const winningTeam = winnerIndex % 2; // Assuming 0 and 2 are team 0, 1 and 3 are team 1
                this.roundScore[winningTeam]++;
                console.log(`Player ${this.players[winnerIndex].name} wins the round!`);
                lastWinnerIndex = winnerIndex;
            }
            roundNumber++;
        }

        // Hand over
        if (this.roundScore[0] >= 2 && this.roundScore[1] >= 2) {
             // Tie scenario on hand? Usually handled by "First winner" rule or "Who didn't empata"
             // If 1st round draw (1-1), 2nd round draw (2-2) -> Distribute again or points split?
             // Official rules: Empate na 1a, quem ganha a 2a leva. Se empatar a 2a, quem ganha a 3a leva.
             // Se empatar todas, ninguém ganha.
             // Simplification: If >2 on both, check who won the earliest non-tied round?
             // Since we just did ++, let's assume standard win.
             // If 1st tied (1-1), 2nd Team A (2-1) -> Team A wins hand.
             // If 1st tied (1-1), 2nd tied (2-2) -> 3rd decides.
        }

        if (this.roundScore[0] >= 2) {
             this.score[0] += this.trucoValue;
             console.log(`Team 1 wins the hand! (+${this.trucoValue} points)`);
        } else {
             this.score[1] += this.trucoValue;
             console.log(`Team 2 wins the hand! (+${this.trucoValue} points)`);
        }

        // Rotate dealer/starter
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
    }

    private async playRound(startIndex: number): Promise<{ winnerIndex: number, type: 'normal' | 'fold' | 'draw' }> {
        const playedCards: { playerIndex: number, card: ICard }[] = [];
        let currentIndex = startIndex;

        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[currentIndex];
            console.log(`Turn: ${player.name}`);

            if (player instanceof Bot) {
                // Bot move
                const state: GameStateView = {
                    vira: this.vira!,
                    roundCards: playedCards,
                    handScores: this.roundScore
                };

                // Bot deciding to Truco?
                if (this.trucoValue === 1 && player.shouldAcceptTruco(state)) {
                    // In real game, bot would ASK for truco. Here simplified.
                    // Let's make bot ask for truco 10% of time if strong?
                    if (Math.random() < 0.2) {
                        console.log(`${player.name} yells TRUCO!`);
                        // Human must accept/run. Simplified: Auto accept for now for test.
                        this.trucoValue = 3;
                    }
                }

                const moveIndex = player.decideMove(state);
                const card = player.playCard(moveIndex)!;
                console.log(`${player.name} played ${card.toString()}`);
                playedCards.push({ playerIndex: currentIndex, card });
            } else {
                // Human move
                // Show hand
                console.log(`Your hand: ${player.hand.map((c, i) => `[${i}] ${c.toString()}`).join(' ')}`);
                // Ask for input
                const index = await this.askQuestion(`Choose card index (0-${player.hand.length-1}), 't' for Truco, or 'd' to Fold (Desistir): `);

                if (index.toLowerCase() === 'd') {
                    // Fold logic
                    // Opponent wins
                    // Assuming 2 players for now, next player is opponent
                    const opponentIndex = (currentIndex + 1) % this.players.length;
                    return { winnerIndex: opponentIndex, type: 'fold' };
                } else if (index.toLowerCase() === 't') {
                     if (this.trucoValue < 12) {
                         console.log("You yelled TRUCO!");
                         this.trucoValue = this.trucoValue === 1 ? 3 : this.trucoValue + 3;
                         // Ask bot if accepts?
                         // Simplified: Bot accepts.
                         console.log("Bot accepts.");
                         // Now play card
                         const cardIdx = await this.askQuestion(`Choose card index (0-${player.hand.length-1}): `);
                         const card = player.playCard(parseInt(cardIdx))!;
                         console.log(`${player.name} played ${card.toString()}`);
                         playedCards.push({ playerIndex: currentIndex, card });
                     } else {
                         console.log("Already max value!");
                         // Force play card logic again... simplistic retry
                         i--;
                         continue;
                     }
                } else {
                    const idx = parseInt(index);
                    if (isNaN(idx) || idx < 0 || idx >= player.hand.length) {
                        console.log("Invalid index.");
                        i--; // Retry
                        continue;
                    }
                    const card = player.playCard(idx)!;
                    console.log(`${player.name} played ${card.toString()}`);
                    playedCards.push({ playerIndex: currentIndex, card });
                }
            }

            currentIndex = (currentIndex + 1) % this.players.length;
        }

        // Determine winner of round
        let bestCardIdx = 0;
        let isDraw = false;

        for (let i = 1; i < playedCards.length; i++) {
            const current = playedCards[i];
            const best = playedCards[bestCardIdx];

            const currentPower = current.card.getPower(this.vira!);
            const bestPower = best.card.getPower(this.vira!);

            if (currentPower > bestPower) {
                bestCardIdx = i;
                isDraw = false;
            } else if (currentPower === bestPower) {
                isDraw = true;
            }
        }

        if (isDraw) return { winnerIndex: -1, type: 'draw' };
        return { winnerIndex: playedCards[bestCardIdx].playerIndex, type: 'normal' };
    }

    private askQuestion(query: string): Promise<string> {
        return new Promise(resolve => this.rl.question(query, resolve));
    }
}
