import React, { useEffect, useState, useRef } from 'react';
import { MatchController } from './lib/MatchController';
import { Player } from './lib/Player';
import { Bot } from './lib/Bot';
import { PlayerType, Rank } from './lib/types';
import { WebIO } from './lib/WebIO';

interface GameState {
    logs: string[];
    waitingForInput: boolean;
    prompt: string | null;
}

function App() {
    const [logs, setLogs] = useState<string[]>([]);
    const [waitingForInput, setWaitingForInput] = useState(false);
    const [prompt, setPrompt] = useState<string | null>(null);
    const [currentPlayerHand, setCurrentPlayerHand] = useState<string[]>([]);

    // We use a ref to hold the resolve function for the Promise
    const resolveInputRef = useRef<((answer: string) => void) | null>(null);

    // Refs for Game Controller to prevent re-instantiation
    const gameRef = useRef<MatchController | null>(null);

    const logEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize Game
        if (!gameRef.current) {
            const onLog = (msg: string) => {
                setLogs(prev => [...prev, msg]);
            };

            const onAsk = (question: string, resolve: (answer: string) => void) => {
                setPrompt(question);
                setWaitingForInput(true);
                resolveInputRef.current = resolve;

                // Update hand visualization if possible
                // Since onAsk is called, we can inspect the game state.
                // But MatchController doesn't easily expose "current player hand" directly without peeking.
                // However, the "question" text might give context, or we can use the game instance.
                if (gameRef.current) {
                    // Assuming Player 0 is Human
                    const human = gameRef.current.getPlayers().find(p => p.type === PlayerType.Human);
                    if (human) {
                        setCurrentPlayerHand(human.hand.map(c => c.toString()));
                    }
                }
            };

            const webIO = new WebIO(onLog, onAsk);
            const game = new MatchController(webIO, webIO);

            const human = new Player("Human", PlayerType.Human);
            const bot = new Bot("Bot");

            game.addPlayer(human);
            game.addPlayer(bot);

            gameRef.current = game;

            // Start game
            game.startMatch().catch(err => console.error(err));
        }
    }, []);

    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const handleInput = (value: string) => {
        if (resolveInputRef.current) {
            setWaitingForInput(false);
            setPrompt(null);
            const resolve = resolveInputRef.current;
            resolveInputRef.current = null;
            resolve(value);
        }
    };

    return (
        <div className="game-container">
            <div className="header">
                <div className="score-board">
                    <h2>Truco Web</h2>
                    {gameRef.current && (
                        <div>
                            Team 1: {gameRef.current.getScore()[0]} | Team 2: {gameRef.current.getScore()[1]}
                        </div>
                    )}
                </div>
                <div className="vira-container">
                     {gameRef.current && gameRef.current.getVira() && (
                         <h3>Vira: {gameRef.current.getVira()}</h3>
                     )}
                </div>
            </div>

            <div className="log-container">
                {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                ))}
                <div ref={logEndRef} />
            </div>

            <div className="table-area">
                {/* Visual representation of table cards could go here */}
                <p>Table Area (Check logs for played cards)</p>
            </div>

            <div className="controls">
                {waitingForInput && (
                    <>
                        <div className="input-prompt">{prompt}</div>
                        <div className="buttons">
                            {/* Card Buttons */}
                            {prompt?.includes("Choose card index") && currentPlayerHand.map((card, idx) => (
                                <button key={idx} className="card-btn" onClick={() => handleInput(idx.toString())}>
                                    {card}
                                </button>
                            ))}

                            {/* Truco Button */}
                            {prompt?.includes("'t' for Truco") && (
                                <button className="truco-btn" onClick={() => handleInput('t')}>
                                    TRUCO!
                                </button>
                            )}

                             {/* Fold Button */}
                            {prompt?.includes("'d' to Fold") && (
                                <button className="fold-btn" onClick={() => handleInput('d')}>
                                    Desistir (Fold)
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default App;
