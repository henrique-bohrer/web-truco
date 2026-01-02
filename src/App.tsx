import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MatchController } from './lib/MatchController';
import { Player } from './lib/Player';
import { Bot } from './lib/Bot';
import { PlayerType, Rank, ICard } from './lib/types';
import { WebIO } from './lib/WebIO';
import Card from './components/Card';
import Hand from './components/Hand';

function App() {
    const [gameStarted, setGameStarted] = useState(false);
    const [gameMode, setGameMode] = useState<'bot' | 'local' | 'online'>('bot');
    const [roomId, setRoomId] = useState<string>('');
    const [nickname, setNickname] = useState<string>('');
    const [serverUrl, setServerUrl] = useState<string>('http://localhost:3001');
    const [isOnline, setIsOnline] = useState(false);

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
    const socketRef = useRef<Socket | null>(null);

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

    const startGame = (mode: 'bot' | 'local' | 'online') => {
        setGameMode(mode);
        if (mode === 'online') {
            setIsOnline(true);
        } else {
            setGameStarted(true);
        }
    };

    const connectOnline = (overrideRoomId?: string) => {
        const targetRoomId = overrideRoomId || roomId;
        const newSocket = io(serverUrl);
        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            newSocket.emit('join-room', { roomId: targetRoomId, nickname });
        });

        newSocket.on('log', (msg: string) => {
            setLogs(prev => [...prev, msg]);
        });

        newSocket.on('opponent-disconnected', () => {
            alert('Opponent disconnected! Game Over.');
            resetGame();
        });

        newSocket.on('ask', (question: string) => {
            setPrompt(question);
            setWaitingForInput(true);
            resolveInputRef.current = (answer) => {
                newSocket.emit('answer', answer);
            };
        });

        newSocket.on('update-state', () => {
             newSocket.emit('request-state');
        });

        newSocket.on('state-update', (state: any) => {
             setPlayers(state.players);
             setTableCards(state.tableCards);
             setScore(state.score);
             setVira(state.vira);
             setTrucoVal(state.trucoVal);
             setMaoIndex(state.maoIndex);
        });

        setGameStarted(true);
    };

    const resetGame = () => {
        if (gameRef.current) {
            gameRef.current.stopMatch();
            gameRef.current = null;
        }
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setGameStarted(false);
        setIsOnline(false);
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
        if (gameStarted && !gameRef.current && gameMode !== 'online') {
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

    // Check for Game Over
    const gameOver = score[0] >= 12 || score[1] >= 12;
    const winnerName = score[0] >= 12 ? players[0]?.name : players[1]?.name;

    // Waiting Room UI
    if (gameStarted && isOnline && players.length < 2) {
        return (
            <div className="game-container" style={{ textAlign: 'center', height: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h1>Waiting for Opponent...</h1>
                <div style={{ margin: '20px 0' }}>
                    <p>Share this Room ID with your friend:</p>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '2px', margin: '10px 0', userSelect: 'all' }}>
                        {roomId}
                    </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                    <p>Log:</p>
                    <div style={{ fontSize: '12px', color: '#ccc' }}>
                        {logs[logs.length - 1]}
                    </div>
                </div>
                <button onClick={resetGame} style={{ marginTop: '30px' }}>Cancel</button>
            </div>
        );
    }

    if (!gameStarted) {
        if (isOnline) {
             return (
                <div className="game-container" style={{ textAlign: 'center', height: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h1>Online Multiplayer</h1>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            placeholder="Nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            style={{ padding: '10px', width: '250px', fontSize: '16px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            placeholder="Server URL (e.g. http://192.168.1.5:3001)"
                            value={serverUrl}
                            onChange={(e) => setServerUrl(e.target.value)}
                            style={{ padding: '10px', width: '250px', fontSize: '16px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <div style={{fontSize: '14px', marginBottom: '5px'}}>Join Existing Room:</div>
                        <div style={{display: 'flex', gap: '5px'}}>
                            <input
                                type="text"
                                placeholder="Room ID"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                style={{ padding: '10px', width: '150px', fontSize: '16px' }}
                            />
                            <button onClick={() => connectOnline()} disabled={!roomId || !serverUrl || !nickname}>Join</button>
                        </div>
                        <div style={{fontSize: '14px', margin: '5px 0'}}>OR</div>
                        <button onClick={() => {
                            const newRoomId = Math.random().toString(36).substring(2, 7).toUpperCase();
                            setRoomId(newRoomId);
                            connectOnline(newRoomId);
                        }} disabled={!serverUrl || !nickname}>Create New Room</button>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        <button onClick={() => setIsOnline(false)}>Back</button>
                    </div>
                </div>
             );
        }
        return (
            <div className="game-container" style={{ textAlign: 'center', height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h1>Truco Web</h1>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <button onClick={() => startGame('bot')}>Play vs Bot</button>
                    <button onClick={() => startGame('local')}>Local Multiplayer</button>
                    <button onClick={() => startGame('online')}>Online (Alpha)</button>
                </div>
            </div>
        );
    }

    if (gameOver) {
         return (
             <div className="game-container" style={{ textAlign: 'center', height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                 <h1>Game Over!</h1>
                 <h2>Winner: {winnerName}</h2>
                 <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
                     <button onClick={() => {
                         // Full reset then restart same mode
                         const mode = gameMode;
                         resetGame();
                         setTimeout(() => startGame(mode), 100);
                     }}>Play Again</button>
                     <button onClick={resetGame}>Menu</button>
                 </div>
             </div>
         );
    }

    const bottomPlayer = players[0];
    const topPlayer = players[1];

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
                    <h2>Truco Web ({gameMode === 'bot' ? 'Vs Bot' : (gameMode === 'online' ? 'Online' : 'Local')})</h2>
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
                    <div className="player-name" style={{position: 'absolute', top: '10px', left: '10px', color: 'white', zIndex: 20}}>{topPlayer?.name}</div>
                    {topPlayer && (
                        <Hand
                            cards={topPlayer.hand}
                            position="top"
                            hidden={gameMode !== 'local'}
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
                    {tableCards.length === 0 && <div style={{ color: 'white', opacity: 0.5, padding: '2rem' }}>Table Empty</div>}
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
                    <div className="player-name" style={{position: 'absolute', bottom: '10px', left: '10px', color: 'white', zIndex: 20}}>{bottomPlayer?.name}</div>
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
