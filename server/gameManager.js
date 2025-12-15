
const CARDS = [
    { id: 1, name: "El Callejón del Beso" },
    { id: 2, name: "Las Momias" },
    { id: 3, name: "Teatro Juárez" },
    { id: 4, name: "Cerro de la Bufa" },
    { id: 5, name: "Mina El Edén" },
    { id: 6, name: "Sótano de las Golondrinas" },
    { id: 7, name: "Jardín Surrealista" },
    { id: 8, name: "Feria de San Marcos" },
    { id: 9, name: "La Catrina" },
    { id: 10, name: "Enchiladas Mineras" },
    { id: 11, name: "Asado de Boda" },
    { id: 12, name: "Caja de Agua" },
    { id: 13, name: "Deshilado" },
    { id: 14, name: "Alhóndiga de Granaditas" },
    { id: 15, name: "Teleférico" },
    { id: 16, name: "Real de Catorce" },
    { id: 17, name: "Cerro del Muerto" },
    { id: 18, name: "Cristo Rey" },
    { id: 19, name: "La Quemada" },
    { id: 20, name: "Cascada de Tamul" },
    { id: 21, name: "El Pípila" },
    { id: 22, name: "La Universidad" },
    { id: 23, name: "La Catedral" },
    { id: 24, name: "Las Morismas de Bracho" },
    { id: 25, name: "El Rebozo" },
    { id: 26, name: "El Parque Tangamanga" },
    { id: 27, name: "El Ferrocarril" },
    { id: 28, name: "El Cristo Roto" }
];

class Room {
    constructor(id, hostId) {
        this.id = id;
        this.players = new Map(); // socketId -> { name, board, markedIndices }
        this.deck = [];
        this.drawnCards = [];
        this.currentCardIndex = -1;
        this.status = 'waiting'; // waiting, playing, ended
        this.intervalId = null;
        this.hostId = hostId;
    }

    addPlayer(socketId, name) {
        if (this.players.size >= 4) {
            throw new Error('La sala está llena (máximo 4 jugadores)');
        }
        if (this.status !== 'waiting') {
            throw new Error('El juego ya ha comenzado');
        }

        // Generate a random 4x4 board (16 cards) from the 28 available
        const board = this.generateBoard();

        this.players.set(socketId, {
            id: socketId,
            name,
            board,
            markedIndices: new Set() // Indices 0-15 on the board that are marked
        });
        return true;
    }

    removePlayer(socketId) {
        this.players.delete(socketId);
        if (this.players.size === 0) {
            this.stopGame();
        }
    }

    generateBoard() {
        const shuffled = [...CARDS].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 16);
    }

    startGame(io, difficulty = 'normal') {
        if (this.status === 'playing') return;

        this.status = 'playing';
        this.deck = [...CARDS].sort(() => 0.5 - Math.random());
        this.drawnCards = [];
        this.currentCardIndex = -1;

        // Determine speed
        let intervalTime = 4000; // Normal default
        if (difficulty === 'easy') intervalTime = 6000;
        if (difficulty === 'hard') intervalTime = 3000;

        console.log(`Room ${this.id}: Starting game with difficulty ${difficulty} (${intervalTime}ms)`);

        io.to(this.id).emit('gameStarted', {
            deckSize: this.deck.length
        });

        // Wait 2 seconds before drawing the first card to allow clients to load
        setTimeout(() => {
            console.log(`Room ${this.id}: Starting card cycle after 2s delay.`);
            // Draw first card
            this.drawNextCard(io);

            // Set interval to draw cards
            this.intervalId = setInterval(() => {
                this.drawNextCard(io);
            }, intervalTime);
        }, 2000);
    }

    drawNextCard(io) {
        const nextIndex = this.currentCardIndex + 1;

        // 1. Safety check: If we somehow got called after deck is empty
        if (nextIndex >= this.deck.length) {
            return;
        }

        // 2. Advance and Draw
        this.currentCardIndex = nextIndex;
        const card = this.deck[this.currentCardIndex];
        this.drawnCards.push(card);

        console.log(`Room ${this.id}: Drawing card ${this.currentCardIndex + 1}/${this.deck.length} (ID: ${card.id}) - ${card.name}`);
        io.to(this.id).emit('cardDrawn', card);

        // 3. IMMEDIATE CHECK: Was this the last card?
        if (this.currentCardIndex >= this.deck.length - 1) {
            console.log(`Room ${this.id}: Last card drawn. Starting rapid game-over sequence.`);

            // Stop the drawing interval IMMEDIATELY so we don't wait 4s for the next tick
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }

            // Allow 2 seconds for players to claim victory on the last card
            // This replaces the previous implicit 4s + delay
            setTimeout(() => {
                if (this.status === 'playing') {
                    console.log(`Room ${this.id}: Time limit reached. Ending game.`);
                    this.stopGame();
                    io.to(this.id).emit('gameOver', { winner: null, reason: 'Deck exhausted' });
                }
            }, 4000);
        }
    }

    stopGame() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.status = 'ended';
    }

    validateWin(socketId) {
        const player = this.players.get(socketId);
        if (!player) return false;

        // Check if all cards on the board have been drawn
        // Since we are not strictly tracking "marked" state on server per click (client marks),
        // we can validate if the player's board cards exist in `drawnCards`.
        // Or if we want to be strict, we check if they are in drawnCards.

        const drawnIds = new Set(this.drawnCards.map(c => c.id));
        const haswon = player.board.every(card => drawnIds.has(card.id));

        return haswon;
    }
}

class GameManager {
    constructor() {
        this.rooms = new Map();
    }

    createRoom(hostId) {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new Room(roomId, hostId);
        this.rooms.set(roomId, room);
        return roomId;
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    joinRoom(roomId, socketId, playerName) {
        const room = this.rooms.get(roomId);
        if (!room) throw new Error('Room not found');

        // Calls addPlayer which now throws specific errors if it fails
        room.addPlayer(socketId, playerName);
        return room.players.get(socketId);
    }
}

export const gameManager = new GameManager();
