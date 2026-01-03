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
    const [connectionError, setConnectionError] = useState<string | null>(null);

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
    const [myPlayerIndex, setMyPlayerIndex] = useState<number>(0);
    const [, setUpdateTrigger] = useState(0);

    const resolveInputRef = useRef<((answer: string) => void) | null>(null);
    const gameRef = useRef<MatchController | null>(null);
    const logEndRef = useRef<HTMLDivElement | null>(null);
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
        setConnectionError(null);

        const newSocket = io(serverUrl, {
            reconnection: true,
            reconnectionAttempts: 20,
            reconnectionDelay: 1000,
        });
        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            setConnectionError(null);
            newSocket.emit('join-room', { roomId: targetRoomId, nickname });
        });

        newSocket.on('game-start', (data: { myIndex: number }) => {
            setMyPlayerIndex(data.myIndex);
        });

        newSocket.on('connect_error', (err) => {
            console.error("Connection Error:", err);
            setConnectionError(`Could not connect to server at ${serverUrl}. Is it running?`);
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
             if (typeof state.yourIndex === 'number') {
                 setMyPlayerIndex(state.yourIndex);
             }
             setPlayers(state.players);
             setTableCards(state.tableCards);
             setScore(state.score);
             setVira(state.vira);
             setTrucoVal(state.trucoVal);
             setMaoIndex(state.maoIndex);
             if (typeof state.activePlayerIdx === 'number') {
                 setActivePlayerIdx(state.activePlayerIdx);
             }
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
            syncState();

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
            <div className="game-container" style={{ textAlign: 'center', minHeight: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
                {connectionError && (
                    <div style={{ background: '#ff4444', color: 'white', padding: '15px', marginBottom: '20px', borderRadius: '8px', maxWidth: '500px', margin: '0 auto 20px' }}>
                        <strong>{connectionError}</strong>
                        <div style={{ fontSize: '14px', marginTop: '8px' }}>Run <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '3px' }}>npm run start:server</code> in a separate terminal.</div>
                    </div>
                )}
                <h1 style={{ marginBottom: '30px' }}>Waiting for Opponent...</h1>
                <div style={{ margin: '20px auto', maxWidth: '400px' }}>
                    <p style={{ marginBottom: '10px', fontSize: '16px' }}>Share this Room ID with your friend:</p>
                    <div style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        letterSpacing: '4px',
                        margin: '15px 0',
                        userSelect: 'all',
                        background: 'rgba(255,255,255,0.1)',
                        padding: '15px',
                        borderRadius: '10px',
                        border: '2px dashed rgba(255,255,255,0.3)'
                    }}>
                        {roomId}
                    </div>
                </div>
                <div style={{ marginTop: '30px', fontSize: '14px', color: '#ccc', maxWidth: '400px', margin: '30px auto 0' }}>
                    <p style={{ marginBottom: '5px' }}>Recent Activity:</p>
                    <div style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '10px',
                        borderRadius: '5px',
                        minHeight: '40px',
                        fontFamily: 'monospace'
                    }}>
                        {logs.slice(-3).map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                    </div>
                </div>
                <button onClick={resetGame} style={{ marginTop: '30px' }}>Cancel</button>
            </div>
        );
    }

    if (!gameStarted) {
        if (isOnline) {
            return (
                <div className="game-container" style={{ textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
                    <h1 style={{ marginBottom: '30px' }}>🎮 Online Multiplayer</h1>
                    <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
                        <div style={{ marginBottom: '15px' }}>
                            <input
                                type="text"
                                placeholder="Your Nickname"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                style={{
                                    padding: '12px 15px',
                                    width: '100%',
                                    fontSize: '16px',
                                    borderRadius: '8px',
                                    border: '2px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <input
                                type="text"
                                placeholder="Server URL (e.g. http://192.168.1.5:3001)"
                                value={serverUrl}
                                onChange={(e) => setServerUrl(e.target.value)}
                                style={{
                                    padding: '12px 15px',
                                    width: '100%',
                                    fontSize: '14px',
                                    borderRadius: '8px',
                                    border: '2px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{
                            background: 'rgba(0,0,0,0.2)',
                            padding: '20px',
                            borderRadius: '10px',
                            marginBottom: '15px'
                        }}>
                            <div style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 'bold' }}>Join Existing Room:</div>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                                <input
                                    type="text"
                                    placeholder="Room ID"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                                    style={{
                                        padding: '10px',
                                        flex: 1,
                                        fontSize: '16px',
                                        borderRadius: '6px',
                                        border: '2px solid rgba(255,255,255,0.2)',
                                        background: 'rgba(255,255,255,0.15)',
                                        color: 'white',
                                        textAlign: 'center',
                                        letterSpacing: '2px'
                                    }}
                                />
                                <button
                                    onClick={() => connectOnline()}
                                    disabled={!roomId || !serverUrl || !nickname}
                                    style={{ padding: '10px 20px' }}
                                >
                                    Join
                                </button>
                            </div>

                            <div style={{
                                fontSize: '14px',
                                margin: '15px 0',
                                color: 'rgba(255,255,255,0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                                OR
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
                            </div>

                            <button
                                onClick={() => {
                                    const newRoomId = Math.random().toString(36).substring(2, 7).toUpperCase();
                                    setRoomId(newRoomId);
                                    connectOnline(newRoomId);
                                }}
                                disabled={!serverUrl || !nickname}
                                style={{ width: '100%' }}
                            >
                                🎲 Create New Room
                            </button>
                        </div>

                        <button onClick={() => setIsOnline(false)} style={{ width: '100%' }}>← Back to Menu</button>
                    </div>
                </div>
            );
        }
        return (
            <div className="game-container" style={{ textAlign: 'center', minHeight: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
                <h1 style={{ marginBottom: '40px', fontSize: '3rem' }}>🃏 Truco Paulista</h1>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '600px', margin: '0 auto' }}>
                    <button onClick={() => startGame('bot')} style={{ minWidth: '150px' }}>🤖 Play vs Bot</button>
                    <button onClick={() => startGame('local')} style={{ minWidth: '150px' }}>👥 Local 2P</button>
                    <button onClick={() => startGame('online')} style={{ minWidth: '150px' }}>🌐 Online (Alpha)</button>
                </div>
            </div>
        );
    }

    if (gameOver) {
        return (
            <div className="game-container" style={{ textAlign: 'center', minHeight: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>🏆 Game Over!</h1>
                <h2 style={{ fontSize: '2rem', marginBottom: '30px' }}>Winner: <span style={{ color: '#ffd700' }}>{winnerName}</span></h2>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
                    <button onClick={() => {
                        const mode = gameMode;
                        resetGame();
                        setTimeout(() => startGame(mode), 100);
                    }}>🔄 Play Again</button>
                    <button onClick={resetGame}>📋 Back to Menu</button>
                </div>
            </div>
        );
    }

    // Determine view perspective based on mode
    let bottomPlayer = players[0];
    let topPlayer = players[1];

    if (gameMode === 'online') {
        if (myPlayerIndex === 1) {
            bottomPlayer = players[1];
            topPlayer = players[0];
        } else {
            bottomPlayer = players[0];
            topPlayer = players[1];
        }
    }

    // FIX CRÍTICO: Condição corrigida para habilitar cliques
    const isMyTurnBottom = gameMode === 'online'
        ? activePlayerIdx === myPlayerIndex
        : activePlayerIdx === 0;

    const isMyTurnTop = gameMode === 'local' && activePlayerIdx === 1;

    return (
        <div className="game-container">
            <div className="header">
                <div className="vira-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '10px' }}>
                    <h3>Vira</h3>
                    {vira && (
                        <Card card={{ rank: vira, suit: '♦️' } as any} size="small" />
                    )}
                </div>

                <div className="score-board" style={{ flexGrow: 1 }}>
                    <h2>Truco Paulista {gameMode === 'bot' ? '(vs Bot)' : (gameMode === 'online' ? '(Online)' : '(Local)')}</h2>
                    <div>{players[0]?.name}: {score[0]} | {players[1]?.name}: {score[1]}</div>
                    <div>Truco Value: {trucoVal}</div>
                </div>

                <button onClick={resetGame} style={{ fontSize: '12px', padding: '8px 15px', marginLeft: '10px', height: 'fit-content', alignSelf: 'center' }}>
                    📋 Menu
                </button>
            </div>

            <div className="game-board">
                <div className="player-area top-player">
                    <div className="player-name" style={{ position: 'absolute', top: '10px', left: '10px', color: 'white', zIndex: 20 }}>
                        {topPlayer?.name}
                    </div>
                    {topPlayer && (
                        <Hand
                            cards={topPlayer.hand}
                            position="top"
                            hidden={gameMode !== 'local'}
                            onCardClick={(i) => {
                                if (isMyTurnTop && waitingForInput && prompt?.includes("Choose card")) {
                                    handleInput(i.toString());
                                }
                            }}
                            disabled={!(isMyTurnTop && waitingForInput)}
                        />
                    )}
                </div>

                <div className="table-area">
                    {tableCards.length === 0 && <div style={{ color: 'white', opacity: 0.5, padding: '2rem' }}>Waiting for cards...</div>}
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        {tableCards.map((item, i) => {
                            const isMe = (gameMode === 'online') ? (item.playerIndex === myPlayerIndex) : (item.playerIndex === 0);
                            const animClass = isMe ? 'anim-bottom' : 'anim-top';

                            return (
                                <div key={i} className={`played-card ${animClass}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Card card={item.card} />
                                    <span style={{ color: 'white', marginTop: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                                        {players[item.playerIndex]?.name || `P${item.playerIndex}`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ position: 'absolute', right: '10px', bottom: '10px', textAlign: 'right', color: 'white', background: 'rgba(0,0,0,0.5)', padding: '8px 12px', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.2)' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7 }}>Mão</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                            {players[maoIndex]?.name || '...'}
                        </div>
                    </div>
                </div>

                <div className="player-area bottom-player">
                    <div className="player-name" style={{ position: 'absolute', bottom: '10px', left: '10px', color: 'white', zIndex: 20 }}>
                        {bottomPlayer?.name}
                    </div>
                    {bottomPlayer && (
                        <Hand
                            cards={bottomPlayer.hand}
                            position="bottom"
                            onCardClick={(i) => {
                                if (isMyTurnBottom && waitingForInput && prompt?.includes("Choose card")) {
                                    handleInput(i.toString());
                                }
                            }}
                            disabled={!(isMyTurnBottom && waitingForInput && prompt?.includes("Choose card"))}
                        />
                    )}
                </div>
            </div>

            <div className="controls">
                {waitingForInput && (
                    <div className="buttons" style={{ justifyContent: 'center', marginTop: '10px' }}>
                        {prompt?.includes("'t' for Truco") && (
                            <button className="truco-btn" onClick={() => handleInput('t')}>
                                🔥 TRUCO!
                            </button>
                        )}

                        {prompt?.includes("'d' to Fold") && (
                            <button className="fold-btn" onClick={() => handleInput('d')}>
                                ❌ Desistir
                            </button>
                        )}

                        {prompt?.includes("yelled TRUCO") && (
                            <>
                                <button className="truco-btn" onClick={() => handleInput('a')}>
                                    ✅ ACEITAR
                                </button>
                                <button className="fold-btn" onClick={() => handleInput('d')}>
                                    🏃 CORRER
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="log-container" style={{ marginTop: '20px', height: '120px' }}>
                {logs.slice(-10).map((log, i) => (
                    <div key={i}>{log}</div>
                ))}
                <div ref={logEndRef} />
            </div>
        </div>
    );
}
export default App;