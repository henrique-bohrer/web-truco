import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { MatchController } from './lib/MatchController';
import { Player } from './lib/Player';
import { PlayerType } from './lib/types';
import { IInputHandler, ILogger } from './lib/IO';

// We need a Logger and InputHandler that wraps the Socket
class SocketInputHandler implements IInputHandler {
    private socket: Socket;
    constructor(socket: Socket) {
        this.socket = socket;
    }
    log(message: string) {
        this.socket.emit('log', message);
    }
    ask(question: string): Promise<string> {
        return new Promise(resolve => {
            this.socket.emit('ask', question);
            this.socket.once('answer', (answer: string) => {
                resolve(answer);
            });
        });
    }
    close() {
        this.socket.emit('game-over');
    }
}

// Broadcaster Logger to send logs to all in room
class RoomLogger implements ILogger {
    private io: Server;
    private roomId: string;
    constructor(io: Server, roomId: string) {
        this.io = io;
        this.roomId = roomId;
    }
    log(message: string) {
        this.io.to(this.roomId).emit('log', message);
        this.io.to(this.roomId).emit('update-state'); // Trigger UI update
    }
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

interface Room {
    id: string;
    players: { socket: Socket, name: string }[];
    game?: MatchController;
}

const rooms: Map<string, Room> = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (data: { roomId: string, nickname: string }) => {
        const { roomId, nickname } = data;
        let room = rooms.get(roomId);
        if (!room) {
            room = { id: roomId, players: [] };
            rooms.set(roomId, room);
        }

        if (room.players.length < 2) {
            room.players.push({ socket, name: nickname || `Player ${room.players.length + 1}` });
            socket.join(roomId);
            socket.emit('log', `Joined room ${roomId}. Waiting for opponent...`);

            if (room.players.length === 2) {
                // Start Game
                const p1Data = room.players[0];
                const p2Data = room.players[1];

                const logger = new RoomLogger(io, roomId);
                const dummyHandler = { ask: () => Promise.resolve(''), close: () => {}, log: () => {} };

                const game = new MatchController(dummyHandler as any, logger);

                const p1 = new Player(p1Data.name, PlayerType.Human);
                const p2 = new Player(p2Data.name, PlayerType.Human);

                const p1Handler = new SocketInputHandler(p1Data.socket);
                const p2Handler = new SocketInputHandler(p2Data.socket);

                game.addPlayer(p1, p1Handler);
                game.addPlayer(p2, p2Handler);

                room.game = game;
                logger.log(`Game Starting! ${p1.name} vs ${p2.name}`);

                // Notify players of their index
                p1Data.socket.emit('game-start', { myIndex: 0 });
                p2Data.socket.emit('game-start', { myIndex: 1 });

                game.startMatch().catch(e => console.error(e));
            }
        } else {
            socket.emit('log', 'Room full.');
        }
    });

    socket.on('disconnect', () => {
        // Find if user was in a room
        for (const [id, room] of rooms) {
            const playerIndex = room.players.findIndex(p => p.socket === socket);
            if (playerIndex !== -1) {
                // Notify other player
                const otherPlayer = room.players.find(p => p.socket !== socket);
                if (otherPlayer) {
                    otherPlayer.socket.emit('log', 'Opponent disconnected. Game Over.');
                    otherPlayer.socket.emit('opponent-disconnected');
                }
                // Cleanup room
                rooms.delete(id);
                break;
            }
        }
    });

    // Handle State Request from Client
    socket.on('request-state', () => {
        // Find room
        for (const [id, room] of rooms) {
            if (room.players.some(p => p.socket === socket) && room.game) {
                // Construct state
                const players = room.game.getPlayers();

                // Identify which player is requesting to verify "me" vs "opponent"
                // But simplified: we send the full state, and client logic handles masking hands.
                // NOTE: For security, we SHOULD mask opponent hand here.

                const requesterIndex = room.players.findIndex(p => p.socket === socket);
                // The game player order matches room.players order usually (p1, p2 added sequentially)

                const state = {
                    yourIndex: requesterIndex, // Send the player's index continuously
                    players: players.map((p, idx) => ({
                        name: p.name,
                        // Only show hand if it belongs to requester
                        hand: idx === requesterIndex ? p.hand : p.hand.map(() => null), // Send nulls or empty for opponent
                        type: p.type
                    })),
                    tableCards: room.game.currentRoundCards,
                    score: room.game.getScore(),
                    vira: room.game.getVira(),
                    trucoVal: room.game.getTrucoValue(),
                    maoIndex: room.game.getMaoPlayerIndex()
                };
                socket.emit('state-update', state);
                break;
            }
        }
    });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
