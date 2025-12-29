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
    players: Socket[];
    game?: MatchController;
}

const rooms: Map<string, Room> = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId: string) => {
        let room = rooms.get(roomId);
        if (!room) {
            room = { id: roomId, players: [] };
            rooms.set(roomId, room);
        }

        if (room.players.length < 2) {
            room.players.push(socket);
            socket.join(roomId);
            socket.emit('log', `Joined room ${roomId}. Waiting for opponent...`);

            if (room.players.length === 2) {
                // Start Game
                const p1Socket = room.players[0];
                const p2Socket = room.players[1];

                const logger = new RoomLogger(io, roomId);
                const dummyHandler = { ask: () => Promise.resolve(''), close: () => {}, log: () => {} };

                const game = new MatchController(dummyHandler as any, logger);

                const p1 = new Player("Player 1", PlayerType.Human);
                const p2 = new Player("Player 2", PlayerType.Human);

                const p1Handler = new SocketInputHandler(p1Socket);
                const p2Handler = new SocketInputHandler(p2Socket);

                game.addPlayer(p1, p1Handler);
                game.addPlayer(p2, p2Handler);

                room.game = game;
                logger.log("Game Starting!");

                // We need to sync state to clients initially and periodically
                // MatchController does not expose state stream easily, relying on 'getters'.
                // Clients need to request sync? Or we push?
                // RoomLogger emits 'update-state'. Clients should request sync via socket event?
                // Ideally we push the state JSON.

                game.startMatch().catch(e => console.error(e));
            }
        } else {
            socket.emit('log', 'Room full.');
        }
    });

    // Handle State Request from Client
    socket.on('request-state', () => {
        // Find room
        for (const [id, room] of rooms) {
            if (room.players.includes(socket) && room.game) {
                // Construct state
                const players = room.game.getPlayers();
                // Filter hands? For now send all, client hides. Secure version would filter.
                const state = {
                    players: players,
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
