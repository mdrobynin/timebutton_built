const {
    SOCKET_GET_CONNECTION_ID_ACTION_NAME,
    SOCKET_JOIN_ACTION_NAME,
    SOCKET_LEAVE_ACTION_NAME,
    SOCKET_USER_ACTION_NAME,
    SOCKET_STATE_RECEIVE_ACTION_NAME,
    SOCKET_ERROR_ACTION_NAME,
    SOCKET_RESET_ACTION_NAME
} = require('../config/constants');
const PlayerState = require('../models/player-state');

class ConnectionHandler {
    constructor (io, gameState) {
        this.io = io;
        this.gameState = gameState;
        this.connections = [];
        this.players = [];
        
        this._addSocketEventHandlers();
    }
    
    sendState() {
        const players = JSON.stringify({ players: this.players });

        this.io.emit(SOCKET_STATE_RECEIVE_ACTION_NAME, players);
    }

    _addSocketEventHandlers() {
        this.io.on('connection', (socket) => {
            this.connections.push(socket);

            socket.emit(SOCKET_GET_CONNECTION_ID_ACTION_NAME, socket.id);

            socket.on(SOCKET_JOIN_ACTION_NAME, (player) => {
                this._newPlayerLoggedInHandler(player);
            });

            socket.on(SOCKET_LEAVE_ACTION_NAME, (player) => {
                this._playerLoggedOutHandler(player);
            });
            
            socket.on(SOCKET_USER_ACTION_NAME, (player) => {
                this._playerReadyHandler(player);
            });
            
            socket.on(SOCKET_RESET_ACTION_NAME, () => {
                this._resetGame();
            });
        });
    }
    
    _playerReadyHandler(player) {
        if (player) {
           const targetPlayer = this.players.find(p => p.id === player.playerId);

           if (targetPlayer) {
                const maxOrder = this.players.map(p => p.order).sort((a, b) => a - b)[this.players.length - 1];
                
                targetPlayer.order = maxOrder ? maxOrder + 1 : 1;
                targetPlayer.buttonPressed = true;

                this._emitCurrentState();
           }
        }
    }
    
    _playerLoggedOutHandler(player) {
        if (player) {
            this.players = this.players.filter(p => p.id !== player.playerId);

            this._emitCurrentState();
        }
    }
    
    _newPlayerLoggedInHandler(player) {
        if (player.playerId && player.playerName) {
            const { playerName, playerId } = player;
            
            if (this.players.map(x => x.playerName).includes(playerName)) {
                this._errorHandler({ message: 'This name have been already taken' });
            } else {
                this.players.push(new PlayerState(playerId, playerName));
        
                this._emitCurrentState();
            }
        }
    }
    
    _resetGame() {
        this.players.forEach(p => {
            p.buttonPressed = false;
            p.order = null;
        });

        this._emitCurrentState();
    }
    
    _emitCurrentState() {
        this.connections.forEach((socket) => {
            socket.emit(SOCKET_STATE_RECEIVE_ACTION_NAME, this.players);
        });
    }
    
    _errorHandler(socket, error) {
        socket.emit(SOCKET_ERROR_ACTION_NAME, error);
    }
}

module.exports = ConnectionHandler;
