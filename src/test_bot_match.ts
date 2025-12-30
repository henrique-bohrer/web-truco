import { MatchController } from './lib/MatchController';
import { Player } from './lib/Player';
import { Bot } from './lib/Bot';
import { IInputHandler, ILogger } from './lib/IO';

// A mock input handler that does nothing or throws error if called (since bots shouldn't need input)
class NoOpInputHandler implements IInputHandler {
    ask(question: string): Promise<string> {
        // Bots do not use the input handler.
        // If this is called, it means logic expects human input.
        return Promise.reject("Bot match should not ask for input");
    }
    close(): void {}
}

class ConsoleLogger implements ILogger {
    log(message: string): void {
        console.log(message);
    }
}

async function runBotMatch() {
    const logger = new ConsoleLogger();
    const inputHandler = new NoOpInputHandler();

    // We pass the NoOp handler.
    // Since MatchController waits for input for "Player", we must treat them as Bots.
    // MatchController checks `if (player instanceof Bot)`
    const game = new MatchController(inputHandler, logger);

    const bot1 = new Bot("Bot 1");
    const bot2 = new Bot("Bot 2");

    game.addPlayer(bot1);
    game.addPlayer(bot2);

    console.log("Starting Bot vs Bot Match...");
    // Start match
    // Since MatchController runs a loop, we can just await it.
    // However, it runs until score 12.
    // We should make sure it doesn't hang forever if bots are dumb.
    // But they have random logic so it should progress.

    await game.startMatch();
    console.log("Bot Match Finished.");
}

runBotMatch().catch(console.error);
