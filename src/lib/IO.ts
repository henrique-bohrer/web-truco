export interface ILogger {
    log(message: string): void;
}

export interface IInputHandler {
    ask(question: string): Promise<string>;
    close(): void;
}
