"use strict"
/* global firebase Table Player Move shuffle cardIndices Join */
/* exported NetGame */

let firebaseConfig = {
    apiKey: "AIzaSyBkKCcqBlYGyW9x1xglCzSVqqCKpJF_Aq4",
    authDomain: "saboteur-a2bd1.firebaseapp.com",
    databaseURL: "https://saboteur-a2bd1.firebaseio.com",
    projectId: "saboteur-a2bd1",
    storageBucket: "",
    messagingSenderId: "909750920785",
    appId: "1:909750920785:web:62f7ca03912cc76a"
};
firebase.initializeApp(firebaseConfig);


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

    createGame(callback) {
        this.roomCode = firebase.database().ref("/rooms").push().key;

        let refRoom = firebase.database().ref(`/rooms/${this.roomCode}`);

        refRoom.transaction(
            (room) => {
                if (room === null) {
                    return {
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

        let refAllRooms = firebase.database().ref("/rooms");
        refAllRooms.once(
            "value",
            (snapshot) => {
                let success = snapshot.hasChild(roomCode);
                if (success) {
                    this._registerCallbacks();
                }
                foundCallback(success);
            }
        );
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
                    room.users[player.name] = "...";
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
        refRoom.update( {
            deck: cardIndices,
            finishCards: finishCards,
            //allMoves: [],
        });

        let refAllUsers = firebase.database().ref(`/rooms/${this.roomCode}/users`);
        refAllUsers.once("value", (snapshot) => {
            let join = new Join(
                snapshot.numChildren(),
                () => firebase.database().ref(`/rooms/${this.roomCode}/gameStarted`).set(true)
            );
            snapshot.forEach(function (child) {
                let refCurrentUser = refAllUsers.child(child.key);
                refCurrentUser.set({
                    role: "...",
                    lastMove: "...",
                }, join.oneDone);
            });
        });
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
