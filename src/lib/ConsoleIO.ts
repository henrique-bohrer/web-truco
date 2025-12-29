import { IInputHandler, ILogger } from './IO';
import * as readline from 'readline';

export class ConsoleLogger implements ILogger {
    log(message: string): void {
        console.log(message);
    }
}

export class ConsoleInputHandler implements IInputHandler {
    private rl: readline.Interface;

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    ask(question: string): Promise<string> {
        return new Promise(resolve => this.rl.question(question, resolve));
    }

    close(): void {
        this.rl.close();
    }
}
