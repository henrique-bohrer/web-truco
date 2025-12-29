import React, { useEffect, useState, useRef } from 'react';
import { MatchController } from './lib/MatchController';
import { Player } from './lib/Player';
import { Bot } from './lib/Bot';
import { PlayerType, Rank, ICard } from './lib/types';
import { WebIO } from './lib/WebIO';
import Card from './components/Card';

function App() {
    const [logs, setLogs] = useState<string[]>([]);
    const [waitingForInput, setWaitingForInput] = useState(false);
    const [prompt, setPrompt] = useState<string | null>(null);

    // Game State
    const [players, setPlayers] = useState<Player[]>([]);
    const [tableCards, setTableCards] = useState<{ playerIndex: number, card: ICard }[]>([]);
    const [score, setScore] = useState<number[]>([0, 0]);
    const [vira, setVira] = useState<Rank | null>(null);
    const [trucoVal, setTrucoVal] = useState<number>(1);
    const [maoIndex, setMaoIndex] = useState<number>(0);
    const [updateTrigger, setUpdateTrigger] = useState(0);

    const resolveInputRef = useRef<((answer: string) => void) | null>(null);
    const gameRef = useRef<MatchController | null>(null);
    const logEndRef = useRef<HTMLDivElement>(null);

    const syncState = () => {
        if (gameRef.current) {
            setPlayers([...gameRef.current.getPlayers()]);
            setTableCards([...gameRef.current.currentRoundCards]);
            setScore([...gameRef.current.getScore()]);
            setVira(gameRef.current.getVira());
            setTrucoVal(gameRef.current.getTrucoValue());
            setMaoIndex(gameRef.current.getMaoPlayerIndex());
            setUpdateTrigger(x => x + 1);
        }
    };

    useEffect(() => {
        if (!gameRef.current) {
            const onLog = (msg: string) => {
                setLogs(prev => [...prev, msg]);
            };

            const onAsk = (question: string, resolve: (answer: string) => void) => {
                setPrompt(question);
                setWaitingForInput(true);
                resolveInputRef.current = resolve;
            };

            const onUpdate = () => {
                syncState();
            };

            const webIO = new WebIO(onLog, onAsk, onUpdate);
            const game = new MatchController(webIO, webIO);

            const human = new Player("Human", PlayerType.Human);
            const bot = new Bot("Bot");

            game.addPlayer(human, webIO);
            game.addPlayer(bot);

            gameRef.current = game;
            syncState(); // Initial sync

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

    // Derived State Helpers
    const humanPlayer = players.find(p => p.type === PlayerType.Human);
    const botPlayer = players.find(p => p.type === PlayerType.Bot);

    // Table Cards needs to handle "Played by who?"
    // For now we just list them.
    // If we want to show position, we need to know who played what.
    // tableCards is an array of objects.

    return (
        <div className="game-container">
            <div className="header">
                <div className="score-board">
                    <h2>Truco Web</h2>
                    <div>Team 1 (You): {score[0]} | Team 2 (Bot): {score[1]}</div>
                    <div>Truco Value: {trucoVal}</div>
                </div>
                <div className="vira-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <h3>Vira</h3>
                     {vira && (
                         // We need a dummy card object for Vira just for display
                         <Card card={{ rank: vira, suit: '♦️' } as any} size="small" />
                     )}
                </div>
            </div>

            {/* Game Board */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '600px', justifyContent: 'space-between', padding: '20px 0' }}>

                {/* Opponent Hand (Top) */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    {botPlayer && botPlayer.hand.map((_, i) => (
                        <Card key={i} hidden />
                    ))}
                    {botPlayer && botPlayer.hand.length === 0 && <div style={{color: 'white', opacity: 0.5}}>No cards</div>}
                </div>

                {/* Table Area (Middle) */}
                <div className="table-area" style={{ position: 'relative', minHeight: '200px' }}>
                    {tableCards.length === 0 && <div style={{ color: 'white', opacity: 0.5 }}>Table Empty</div>}
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        {tableCards.map((item, i) => {
                             let animClass = '';
                             // Simple 1v1 mapping
                             if (players[item.playerIndex]?.type === PlayerType.Human) {
                                 animClass = 'anim-bottom';
                             } else {
                                 animClass = 'anim-top';
                             }

                             return (
                                <div key={i} className={`played-card ${animClass}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Card card={item.card} />
                                    <span style={{ color: 'white', marginTop: '5px', fontSize: '12px' }}>
                                        {players[item.playerIndex]?.name || `P${item.playerIndex}`}
                                    </span>
                                </div>
                             );
                        })}
                    </div>

                    {/* Mao Indicator */}
                    <div style={{ position: 'absolute', right: '-150px', top: '50%', transform: 'translateY(-50%)', textAlign: 'right', color: 'white', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '5px', width: '120px' }}>
                        <div style={{ fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px' }}>Começa (Mão)</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                            {players[maoIndex]?.name || '...'}
                        </div>
                    </div>
                </div>

                {/* Player Hand (Bottom) */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    {humanPlayer && humanPlayer.hand.map((card, i) => (
                        <Card
                            key={i}
                            card={card}
                            onClick={() => {
                                if (waitingForInput && prompt?.includes("Choose card")) {
                                    handleInput(i.toString());
                                }
                            }}
                            disabled={!waitingForInput || !prompt?.includes("Choose card")}
                        />
                    ))}
                    {humanPlayer && humanPlayer.hand.length === 0 && <div style={{color: 'white', opacity: 0.5}}>No cards</div>}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="controls">
                {waitingForInput && (
                    <div className="buttons" style={{ justifyContent: 'center', marginTop: '10px' }}>
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

                        {/* Truco Response Buttons */}
                        {prompt?.includes("Bot yelled TRUCO") && (
                            <>
                                <button className="truco-btn" onClick={() => handleInput('a')}>
                                    ACEITAR
                                </button>
                                <button className="fold-btn" onClick={() => handleInput('d')}>
                                    CORRER (FOLD)
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Logs Overlay or Collapsible? Keeping at bottom for now */}
            <div className="log-container" style={{ marginTop: '20px', height: '100px' }}>
                {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                ))}
                <div ref={logEndRef} />
            </div>
        </div>
    );
}

export default App;
