import { MatchController } from './lib/MatchController';
import { Player } from './lib/Player';
import { Bot } from './lib/Bot';
import { PlayerType } from './lib/types';
import { ConsoleInputHandler, ConsoleLogger } from './lib/ConsoleIO';

async function main() {
    const inputHandler = new ConsoleInputHandler();
    const logger = new ConsoleLogger();
    const game = new MatchController(inputHandler, logger);

    // 1v1 Setup
    const human = new Player("Human", PlayerType.Human);
    const bot = new Bot("Bot");

    game.addPlayer(human);
    game.addPlayer(bot);

    await game.startMatch();
}

main().catch(console.error);
