import { MatchController } from './lib/MatchController';
import { Player } from './lib/Player';
import { Bot } from './lib/Bot';
import { PlayerType } from './lib/types';

async function main() {
    const game = new MatchController();

    // 1v1 Setup
    const human = new Player("Human", PlayerType.Human);
    const bot = new Bot("Bot");

    game.addPlayer(human);
    game.addPlayer(bot);

    await game.startMatch();
}

main().catch(console.error);
