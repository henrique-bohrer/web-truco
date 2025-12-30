import { IInputHandler, ILogger } from './IO';

export class WebIO implements IInputHandler, ILogger {
    private onLog: (msg: string) => void;
    private onAsk: (question: string, resolve: (answer: string) => void) => void;
    private onUpdate: () => void;
    private pendingResolve: ((answer: string) => void) | null = null;

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
            this.pendingResolve = resolve;
            this.onAsk(question, (answer) => {
                this.pendingResolve = null;
                resolve(answer);
            });
        });
    }

    close(): void {
        this.onLog("Game Over");
        this.onUpdate();
    }

    abort(): void {
        if (this.pendingResolve) {
            this.pendingResolve("abort");
            this.pendingResolve = null;
        }
    }
}
