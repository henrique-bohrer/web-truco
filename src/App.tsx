import React, { useEffect, useState, useRef } from 'react';
import { MatchController } from './lib/MatchController';
import { Player } from './lib/Player';
import { Bot } from './lib/Bot';
import { PlayerType, Rank, ICard } from './lib/types';
import { WebIO } from './lib/WebIO';
import Card from './components/Card';
import Hand from './components/Hand';

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

    // Helper to calculate card fan style
    const getCardStyle = (index: number, total: number, isTop: boolean = false): React.CSSProperties => {
        if (total === 0) return {};

        // Spread angle settings
        const spreadAngle = 20; // Degrees between cards
        const centerIndex = (total - 1) / 2;
        const rotate = (index - centerIndex) * spreadAngle;

        // Vertical offset for arc effect (center card higher)
        // y = a * x^2 parabola equation roughly
        const offset = Math.abs(index - centerIndex);
        const translateY = offset * 10;

        return {
            transform: `rotate(${isTop ? -rotate : rotate}deg) translateY(${isTop ? -translateY : translateY}px)`,
            margin: '0 -15px', // Negative margin for overlap
            zIndex: index, // Stack order
        };
    };

    return (
        <div className="game-container">
            <div className="header">
                {/* Vira (Left Side) */}
                <div className="vira-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '10px' }}>
                    <h3>Vira</h3>
                    {vira && (
                        <Card card={{ rank: vira, suit: '♦️' } as any} size="small" />
                    )}
                </div>

                {/* Score Board (Center) */}
                <div className="score-board" style={{ flexGrow: 1 }}>
                    <h2>Truco Web ({gameMode === 'bot' ? 'Vs Bot' : 'Local'})</h2>
                    <div>{players[0]?.name}: {score[0]} | {players[1]?.name}: {score[1]}</div>
                    <div>Truco Value: {trucoVal}</div>
                </div>

                {/* Back Button (Right Side) */}
                <button onClick={resetGame} style={{ fontSize: '12px', padding: '5px 10px', marginLeft: '10px', height: 'fit-content', alignSelf: 'center' }}>
                    Menu
                </button>
            </div>

            {/* Game Board */}
            <div className="game-board">

                {/* Top Hand (Player 2 or Bot) */}
                <div className="player-area top-player">
                    <div className="player-name">{topPlayer?.name}</div>
                    {topPlayer && (
                        <Hand
                            cards={topPlayer.hand}
                            position="top"
                            hidden={!showTopCards}
                            onCardClick={(i) => {
                                if (gameMode === 'local' && activePlayerIdx === 1 && waitingForInput && prompt?.includes("Choose card")) {
                                    handleInput(i.toString());
                                }
                            }}
                            disabled={!(gameMode === 'local' && activePlayerIdx === 1 && waitingForInput)}
                        />
                    )}
                </div>

                {/* Table Area (Middle) */}
                <div className="table-area">
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
                    <div style={{ position: 'absolute', right: '10px', bottom: '10px', textAlign: 'right', color: 'white', background: 'rgba(0,0,0,0.3)', padding: '5px', borderRadius: '5px' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase' }}>Mão</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                            {players[maoIndex]?.name || '...'}
                        </div>
                    </div>
                </div>

                {/* Bottom Hand (Player 1 or Human) */}
                <div className="player-area bottom-player">
                    <div className="player-name">{bottomPlayer?.name}</div>
                    {bottomPlayer && (
                        <Hand
                            cards={bottomPlayer.hand}
                            position="bottom"
                            onCardClick={(i) => {
                                if (activePlayerIdx === 0 && waitingForInput && prompt?.includes("Choose card")) {
                                    handleInput(i.toString());
                                }
                            }}
                            disabled={!(activePlayerIdx === 0 && waitingForInput && prompt?.includes("Choose card"))}
                        />
                    )}
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
