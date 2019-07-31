"use strict"
/* global firebase Table Player Move shuffle cardIndices */
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
                        this.table.players.push(player);
                    });
                    this.table.deck = snapshot.child("deck").val();
                    this.table.finishCards = snapshot.child("finishCards").val();

                    this.onGameStart(this.table);
                }
            );
        }
    }

    _onPlayerAdd(snapshot) {
        if (typeof this._localPlayers[snapshot.key] !== "undefined") {
            return;
        }
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
        // FIXME what if the supplied room code has a forward-slash?
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
        this._localPlayers[player.name] = player;

        let refRoom = firebase.database().ref(`/rooms/${this.roomCode}`);

        refRoom.transaction(
            (room) => {
                console.log(room);
                if (room === null) {
                    return {};
                }
                if (room.gameStarted) {
                    return;
                } else {
                    if (typeof room.users === "undefined") {
                        room.users = [];
                    }
                    room.users[player.name] = {
                        role: "[DATA EXPUNGED]",
                        lastMove: NOOP_MOVE,
                    };
                    return room;
                }
            },
            (error, success) => callback((error === null) && success),
            false
        );
    }

    startGame() {
        let finishCards = [1, 2, 3];
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

                for (let user of Object.values(room.users)) {
                    user.role = "some known value";
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
