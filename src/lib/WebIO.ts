import { IInputHandler, ILogger } from './IO';

export class WebIO implements IInputHandler, ILogger {
    private onLog: (msg: string) => void;
    private onAsk: (question: string, resolve: (answer: string) => void) => void;
    private onUpdate: () => void;

    constructor(
        onLog: (msg: string) => void,
        onAsk: (question: string, resolve: (answer: string) => void) => void,
        onUpdate: () => void
    ) {
        this.onLog = onLog;
        this.onAsk = onAsk;
        this.onUpdate = onUpdate;
    }

    log(message: string): void {
        this.onLog(message);
        this.onUpdate();
    }

    ask(question: string): Promise<string> {
        this.onUpdate();
        return new Promise(resolve => {
            this.onAsk(question, resolve);
        });
    }

    close(): void {
        this.onLog("Game Over");
        this.onUpdate();
    }
}
