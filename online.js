"use strict"
/* global firebase Table Player Move shuffle cardIndices finishCards rolesN */
/* exported NetGame */

let firebaseConfig = {
    apiKey: "AIzaSyCUyZQ2q6ScfcBDnSzkf-MXpkWFjGLDLvs",
    authDomain: "saboteur-db7c9.firebaseapp.com",
    databaseURL: "https://saboteur-db7c9.firebaseio.com",
    projectId: "saboteur-db7c9",
    storageBucket: "",
    messagingSenderId: "784977077365",
    appId: "1:784977077365:web:6c30aaf5c9de20fd"
};
firebase.initializeApp(firebaseConfig);

let NOOP_MOVE = new Move();
NOOP_MOVE.noop();


class OnlinePlayer extends Player {
    constructor(netgame, ...args) {
        super(...args);

        this.netgame = netgame;

        let move = new Move();
        move.noop();
        this.lastMove = move;
    }

    moveDone(move) {
        this.lastMove = move;
        this._moveDone(move);
    }

    makeMove(callback) {
        console.log(this.name);
        this._moveDone = callback;
        this.netgame.onMoveChange(this, this.lastMove, this.moveDone.bind(this));
    }
}

class NetGame {
    constructor() {
        this._localPlayers = {};

        this.table = new Table();
        this.onPlayerAdd = () => {};
        this.onGameStart = () => {};
    }

    _onGameStart(snapshot) {
        if (snapshot.val()) {
            firebase.database().ref(`/rooms/${this.roomCode}`).once(
                "value",
                (snapshot) => {
                    snapshot.child("users").forEach(snapshot => {
                        let player = this._localPlayers[snapshot.key];
                        if (typeof player === "undefined") {
                            player = new OnlinePlayer(this, this.table, snapshot.key);
                        }
                        player.role = snapshot.child("role").val();
                        player.id = snapshot.child("id").val();
                        this.table.players[player.id] = player;
                    });
                    this.table.deck = snapshot.child("deck").val();
                    this.table.finishCards = snapshot.child("finishCards").val();

                    this.table.initializeGame();
                    let player = this.table.players[0];
                    snapshot.child("allMoves").forEach(snapshot => {
                        let move = NetGame._parseMove(snapshot);
                        player = this.table.nextPlayer(player);
                        player.lastMove = move;
                        this.table.processMove(player, move, true);
                    });

                    this.onGameStart(this.table, player);
                }
            );
        }
    }

    _onPlayerAdd(snapshot) {
        this.onPlayerAdd(snapshot.key);
    }

    _registerCallbacks() {
        let refAllUsers = firebase.database().ref(`/rooms/${this.roomCode}/users`);
        refAllUsers.on("child_added", this._onPlayerAdd.bind(this));

        let refGameStarted = firebase.database().ref(`/rooms/${this.roomCode}/gameStarted`);
        refGameStarted.on("value", this._onGameStart.bind(this));
    }

    createGame(isPublic, callback) {
        this.roomCode = firebase.database().ref("/rooms").push().key;

        let refRoom = firebase.database().ref(`/rooms/${this.roomCode}`);

        refRoom.transaction(
            (room) => {
                if (room === null) {
                    return {
                        thePublicGame: isPublic,
                        gameStarted: false,
                    };
                }
            },
            (error, success) => {
                if ((error === null) && success) {
                    this._registerCallbacks();
                    callback(true);
                } else {
                    callback(false);
                }
            },
            false
        );
    }

    joinGame(roomCode, foundCallback) {
        this.roomCode = roomCode;

        let refRoom = firebase.database().ref(`/rooms/${roomCode}`);
        refRoom.once(
            "value",
            (snapshot) => {
                let success = snapshot.exists();
                if (success) {
                    this._registerCallbacks();
                }
                foundCallback(success);
            }
        );
    }

    joinPublicGame(callback) {
        firebase.database().ref("/rooms").orderByChild("thePublicGame").equalTo(true).limitToFirst(1).once("value", (snapshot) => {
            let success = snapshot.numChildren() === 1;
            if (success) {
                snapshot.forEach((snapshot) => {  // there should only ever be one
                    this.roomCode = snapshot.key;
                    this._registerCallbacks();
                    callback();
                });
            } else {
                this.createGame(true, callback);
            }
        });
    }

    addPlayer(player, callback) {
        if (!player.name.match(/[A-Za-z]+/)) {
            callback(false);
            return;
        }
        let refRoom = firebase.database().ref(`/rooms/${this.roomCode}`);
        refRoom.transaction(
            (room) => {
                if (room === null) {
                    return {};
                }
                if (room.gameStarted) {
                    return;
                } else {
                    if (typeof room.users === "undefined") {
                        room.users = [];
                    }
                    if (room.users.length >= 9) {
                        return;
                    }
                    if (typeof room.users[player.name] !== "undefined") {
                        return;
                    }
                    room.users[player.name] = {
                        role: "[DATA EXPUNGED]",
                        lastMove: NOOP_MOVE,
                    };
                    return room;
                }
            },
            (error, success) => {
                if ((error === null) && success) {
                    this._localPlayers[player.name] = player;
                    callback(true);
                } else {
                    callback(false);
                }
            },
            false
        );
    }

    startGame() {
        shuffle(finishCards);
        shuffle(cardIndices);
        this.table.deck = cardIndices;
        this.table.finishCards = finishCards;

        let refRoom = firebase.database().ref(`/rooms/${this.roomCode}`);
        refRoom.transaction(
            (room) => {
                if (room === null) {
                    return {};
                }
                if (room.gameStarted) {
                    return;
                }
                room.gameStarted = true;
                room.thePublicGame = false;
                room.deck = cardIndices;
                room.finishCards = finishCards;

                let userCount = Object.keys(room.users).length;
                let ids = shuffle([...Array(userCount).keys()]);
                let roles = shuffle(rolesN[userCount]).slice();
                for (let user of Object.values(room.users)) {
                    user.role = roles.pop();
                    user.id = ids.pop();
                }

                return room;
            },
            () => {},  // the function should only fail when the game has already started
            false
        );
    }

    static _parseMove(snapshot) {
        let move = new Move();
        snapshot.forEach(function (child) {
            move[child.key] = child.val();
        });
        return move;
    }

    onMoveChange(player, oldMove, callback) {
        let refUser = firebase.database().ref(`/rooms/${this.roomCode}/users/${player.name}`);
        refUser.on(
            "child_changed",
            (snapshot) => {
                refUser.off();
                callback(NetGame._parseMove(snapshot));
            }
        );
        refUser.once(
            "value",
            (snapshot) => {
                let move = NetGame._parseMove(snapshot.child("lastMove"));
                if (!move.equals(oldMove)) {
                    refUser.off();
                    callback(move);
                }
            }
        );
    }

    sendMove(player, move) {
        let refRoom = firebase.database().ref(`/rooms/${this.roomCode}`);
        refRoom.child("allMoves").push().update(move);
        let refUserLastMove = firebase.database().ref(`/rooms/${this.roomCode}/users/${player.name}/lastMove`);
        refUserLastMove.set(move);
    }
}
