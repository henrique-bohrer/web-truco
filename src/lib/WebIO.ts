import { IInputHandler, ILogger } from './IO';

export class WebIO implements IInputHandler, ILogger {
    private onLog: (msg: string) => void;
    private onAsk: (question: string, resolve: (answer: string) => void) => void;

    constructor(
        onLog: (msg: string) => void,
        onAsk: (question: string, resolve: (answer: string) => void) => void
    ) {
        this.onLog = onLog;
        this.onAsk = onAsk;
    }

    log(message: string): void {
        this.onLog(message);
    }

    ask(question: string): Promise<string> {
        return new Promise(resolve => {
            this.onAsk(question, resolve);
        });
    }

    close(): void {
        this.onLog("Game Over");
    }
}
