import React, { useEffect, useState, useRef } from 'react';
import { MatchController } from './lib/MatchController';
import { Player } from './lib/Player';
import { Bot } from './lib/Bot';
import { PlayerType, Rank, ICard } from './lib/types';
import { WebIO } from './lib/WebIO';
import Card from './components/Card';

function App() {
    const [gameStarted, setGameStarted] = useState(false);
    const [gameMode, setGameMode] = useState<'bot' | 'local'>('bot');

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
    const [activePlayerIdx, setActivePlayerIdx] = useState<number>(0);
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
            setActivePlayerIdx(gameRef.current.getActivePlayerIndex());
            setUpdateTrigger(x => x + 1);
        }
    };

    const startGame = (mode: 'bot' | 'local') => {
        setGameMode(mode);
        setGameStarted(true);
    };

    const resetGame = () => {
        if (gameRef.current) {
            gameRef.current.stopMatch();
            gameRef.current = null;
        }
        setGameStarted(false);
        setLogs([]);
        setPlayers([]);
        setTableCards([]);
        setScore([0, 0]);
        setVira(null);
        setTrucoVal(1);
        setMaoIndex(0);
        setActivePlayerIdx(0);
        setWaitingForInput(false);
        setPrompt(null);
    };

    useEffect(() => {
        if (gameStarted && !gameRef.current) {
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

            if (gameMode === 'local') {
                const p1 = new Player("Player 1", PlayerType.Human);
                const p2 = new Player("Player 2", PlayerType.Human);
                game.addPlayer(p1, webIO);
                game.addPlayer(p2, webIO);
            } else {
                const human = new Player("Human", PlayerType.Human);
                const bot = new Bot("Bot");
                game.addPlayer(human, webIO);
                game.addPlayer(bot);
            }

            gameRef.current = game;
            syncState(); // Initial sync

            game.startMatch().catch(err => console.error(err));
        }
    }, [gameStarted, gameMode]);

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

    if (!gameStarted) {
        return (
            <div className="game-container" style={{ textAlign: 'center', height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h1>Truco Web</h1>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <button onClick={() => startGame('bot')}>Play vs Bot</button>
                    <button onClick={() => startGame('local')}>Local Multiplayer</button>
                </div>
            </div>
        );
    }

    const bottomPlayer = players[0];
    const topPlayer = players[1];
    const showTopCards = gameMode === 'local';

    return (
        <div className="game-container">
            <div className="header">
                 {/* Back Button */}
                <button onClick={resetGame} style={{ fontSize: '12px', padding: '5px 10px', marginRight: '10px' }}>
                    Menu
                </button>

                <div className="score-board" style={{ flexGrow: 1 }}>
                    <h2>Truco Web ({gameMode === 'bot' ? 'Vs Bot' : 'Local'})</h2>
                    <div>{players[0]?.name}: {score[0]} | {players[1]?.name}: {score[1]}</div>
                    <div>Truco Value: {trucoVal}</div>
                </div>
                <div className="vira-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <h3>Vira</h3>
                     {vira && (
                         <Card card={{ rank: vira, suit: '♦️' } as any} size="small" />
                     )}
                </div>
            </div>

            {/* Game Board */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '600px', justifyContent: 'space-between', padding: '20px 0' }}>

                {/* Top Hand (Player 2 or Bot) */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <div style={{ position: 'absolute', top: '140px', color: 'white' }}>{topPlayer?.name}</div>
                    {topPlayer && topPlayer.hand.map((card, i) => (
                        <Card
                            key={i}
                            card={card}
                            hidden={!showTopCards} // Hide if Bot, Show if Local
                            onClick={() => {
                                // Allow P2 to click if Local and Turn
                                if (gameMode === 'local' && activePlayerIdx === 1 && waitingForInput && prompt?.includes("Choose card")) {
                                    handleInput(i.toString());
                                }
                            }}
                            disabled={!(gameMode === 'local' && activePlayerIdx === 1 && waitingForInput)}
                        />
                    ))}
                    {topPlayer && topPlayer.hand.length === 0 && <div style={{color: 'white', opacity: 0.5}}>No cards</div>}
                </div>

                {/* Table Area (Middle) */}
                <div className="table-area" style={{ position: 'relative', minHeight: '200px' }}>
                    {tableCards.length === 0 && <div style={{ color: 'white', opacity: 0.5 }}>Table Empty</div>}
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        {tableCards.map((item, i) => {
                             let animClass = '';
                             // Map Index 0 to Bottom, 1 to Top
                             if (item.playerIndex === 0) {
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

                {/* Bottom Hand (Player 1 or Human) */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <div style={{ position: 'absolute', bottom: '180px', color: 'white' }}>{bottomPlayer?.name}</div>
                    {bottomPlayer && bottomPlayer.hand.map((card, i) => (
                        <Card
                            key={i}
                            card={card}
                            onClick={() => {
                                // Allow P1 click if active
                                if (activePlayerIdx === 0 && waitingForInput && prompt?.includes("Choose card")) {
                                    handleInput(i.toString());
                                }
                            }}
                            disabled={!(activePlayerIdx === 0 && waitingForInput && prompt?.includes("Choose card"))}
                        />
                    ))}
                    {bottomPlayer && bottomPlayer.hand.length === 0 && <div style={{color: 'white', opacity: 0.5}}>No cards</div>}
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
                        {prompt?.includes("yelled TRUCO") && (
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
            {/* Logs ... */}
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
