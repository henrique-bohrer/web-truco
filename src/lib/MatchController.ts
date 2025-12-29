import { Deck } from './Deck';
import { Player } from './Player';
import { Bot, GameStateView } from './Bot';
import { Rank, ICard } from './types';
import { IInputHandler, ILogger } from './IO';

export class MatchController {
    private deck: Deck;
    private players: Player[] = [];
    private score: number[] = [0, 0]; // Team 1 vs Team 2
    private roundScore: number[] = [0, 0]; // Rounds won in current hand
    private vira: Rank | null = null;
    private currentTurnIndex: number = 0;
    private trucoValue: number = 1;

    // Public state for UI
    public currentRoundCards: { playerIndex: number, card: ICard }[] = [];

    // Dependencies
    private inputHandler: IInputHandler;
    private logger: ILogger;

    constructor(inputHandler: IInputHandler, logger: ILogger) {
        this.deck = new Deck();
        this.inputHandler = inputHandler;
        this.logger = logger;
    }

    addPlayer(player: Player) {
        if (this.players.length < 4) {
            this.players.push(player);
        }
    }

    // Getters for UI
    public getPlayers() { return this.players; }
    public getScore() { return this.score; }
    public getRoundScore() { return this.roundScore; }
    public getVira() { return this.vira; }
    public getTrucoValue() { return this.trucoValue; }

    async startMatch() {
        this.logger.log("Starting Match!");
        while (this.score[0] < 12 && this.score[1] < 12) {
            await this.playHand();
            this.logger.log(`Current Score: Team 1: ${this.score[0]} | Team 2: ${this.score[1]}`);
        }

        if (this.score[0] >= 12) {
            this.logger.log("Team 1 Wins the Match!");
        } else {
            this.logger.log("Team 2 Wins the Match!");
        }
        this.inputHandler.close();
    }

    private async playHand() {
        this.logger.log("\n--- Starting New Hand ---");
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
        this.logger.log(`Vira is: ${viraCard.toString()}`);

        let roundNumber = 1;
        let lastWinnerIndex = this.currentTurnIndex; // Whoever won last hand or starts first

        // Mão de Ferro logic check
        if (this.score[0] === 11 && this.score[1] === 11) {
             this.logger.log("!!! MÃO DE FERRO !!! (Cards are blind)");
        }

        while (this.roundScore[0] < 2 && this.roundScore[1] < 2) {
            this.logger.log(`\nRound ${roundNumber}`);
            const roundResult = await this.playRound(lastWinnerIndex);

            if (roundResult.type === 'fold') {
                const winningTeam = roundResult.winnerIndex % 2;
                this.roundScore[winningTeam] = 2; // Force win condition
                this.logger.log(`Player ${this.players[roundResult.winnerIndex ^ 1].name} folded! Winner is ${this.players[roundResult.winnerIndex].name}`);
                break;
            }

            const winnerIndex = roundResult.winnerIndex;

            if (winnerIndex === -1) {
                // Draw in round
                this.logger.log("Round Draw!");
                if (roundNumber === 1) {
                    this.roundScore[0] += 1;
                    this.roundScore[1] += 1;
                } else {
                    if (this.roundScore[0] > this.roundScore[1]) {
                        this.roundScore[0] = 2;
                    } else if (this.roundScore[1] > this.roundScore[0]) {
                        this.roundScore[1] = 2;
                    }
                }
            } else {
                const winningTeam = winnerIndex % 2;
                this.roundScore[winningTeam]++;
                this.logger.log(`Player ${this.players[winnerIndex].name} wins the round!`);
                lastWinnerIndex = winnerIndex;
            }
            roundNumber++;
        }

        if (this.roundScore[0] >= 2) {
             this.score[0] += this.trucoValue;
             this.logger.log(`Team 1 wins the hand! (+${this.trucoValue} points)`);
        } else {
             this.score[1] += this.trucoValue;
             this.logger.log(`Team 2 wins the hand! (+${this.trucoValue} points)`);
        }

        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
    }

    private async playRound(startIndex: number): Promise<{ winnerIndex: number, type: 'normal' | 'fold' | 'draw' }> {
        this.currentRoundCards = []; // Clear table at start of round
        let currentIndex = startIndex;

        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[currentIndex];
            this.logger.log(`Turn: ${player.name}`);

            if (player instanceof Bot) {
                // Bot move
                const state: GameStateView = {
                    vira: this.vira!,
                    roundCards: this.currentRoundCards,
                    handScores: this.roundScore
                };

                if (this.trucoValue === 1 && player.shouldAcceptTruco(state)) {
                    if (Math.random() < 0.2) {
                        this.logger.log(`${player.name} yells TRUCO!`);
                        this.trucoValue = 3;
                    }
                }

                const moveIndex = player.decideMove(state);
                const card = player.playCard(moveIndex)!;
                this.logger.log(`${player.name} played ${card.toString()}`);
                this.currentRoundCards.push({ playerIndex: currentIndex, card });
            } else {
                // Human move
                this.logger.log(`Your hand: ${player.hand.map((c, i) => `[${i}] ${c.toString()}`).join(' ')}`);
                const index = await this.inputHandler.ask(`Choose card index (0-${player.hand.length-1}), 't' for Truco, or 'd' to Fold (Desistir): `);

                if (index.toLowerCase() === 'd') {
                    const opponentIndex = (currentIndex + 1) % this.players.length;
                    return { winnerIndex: opponentIndex, type: 'fold' };
                } else if (index.toLowerCase() === 't') {
                     if (this.trucoValue < 12) {
                         this.logger.log("You yelled TRUCO!");
                         this.trucoValue = this.trucoValue === 1 ? 3 : this.trucoValue + 3;
                         this.logger.log("Bot accepts.");
                         const cardIdx = await this.inputHandler.ask(`Choose card index (0-${player.hand.length-1}): `);
                         const card = player.playCard(parseInt(cardIdx))!;
                         this.logger.log(`${player.name} played ${card.toString()}`);
                         this.currentRoundCards.push({ playerIndex: currentIndex, card });
                     } else {
                         this.logger.log("Already max value!");
                         i--;
                         continue;
                     }
                } else {
                    const idx = parseInt(index);
                    if (isNaN(idx) || idx < 0 || idx >= player.hand.length) {
                        this.logger.log("Invalid index.");
                        i--; // Retry
                        continue;
                    }
                    const card = player.playCard(idx)!;
                    this.logger.log(`${player.name} played ${card.toString()}`);
                    this.currentRoundCards.push({ playerIndex: currentIndex, card });
                }
            }

            currentIndex = (currentIndex + 1) % this.players.length;
        }

        // Determine winner of round
        let bestCardIdx = 0;
        let isDraw = false;

        for (let i = 1; i < this.currentRoundCards.length; i++) {
            const current = this.currentRoundCards[i];
            const best = this.currentRoundCards[bestCardIdx];

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
}
