"use strict"
/* global firebase Table Player Move shuffle cardIndices */
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

    makeMove(callback) {
        console.log(this.name);
        this.netgame.onMoveChange(this, this.lastMove, callback);
    }
}

class NetGame {
    constructor() {
        this.table = new Table();
        this.onPlayerAdd = () => {};
    }

    _onPlayerAdd(snapshot) {
        let player = new OnlinePlayer(this, this.table, snapshot.key);
        if (this.table.players.map(p => p.name).includes(player.name)) {
            return;
        }
        this.table.players.push(player);
        this.onPlayerAdd(player);
    }

    createGame() {
        this.roomCode = firebase.database().ref("/rooms").push().key;
        firebase.database().ref(`/rooms/${this.roomCode}/gameStarted`).set(false);

        let refAllUsers = firebase.database().ref(`/rooms/${this.roomCode}/users`);
        refAllUsers.on("child_added", this._onPlayerAdd.bind(this));
    }

    joinGame(roomCode, foundCallback, startedCallback) {
        // FIXME what if the supplied room code has a forward-slash?
        this.roomCode = roomCode;

        let refAllRooms = firebase.database().ref("/rooms");
        refAllRooms.once("value")
            .then(function(snapshot) {
                foundCallback(snapshot.hasChild(roomCode));
                //TODO don't join started game
            });

        let refAllUsers = firebase.database().ref(`/rooms/${roomCode}/users`);
        refAllUsers.on("child_added", this._onPlayerAdd.bind(this));


        let refGameStarted = firebase.database().ref(`/rooms/${this.roomCode}/gameStarted`);
        refGameStarted.on("value", (snapshot) => {
            if (snapshot.val()) {
                firebase.database().ref(`/rooms/${roomCode}`).once("value", (snapshot) => {
                    this.table.deck = snapshot.child("deck").val();
                    this.table.finishCards = snapshot.child("finishCards").val();

                    startedCallback(this.table);
                });
            }
        });
    }

    addPlayer(player) {
        this.table.players.push(player);
        let refUser = firebase.database().ref(`/rooms/${this.roomCode}/users/${player.name}`);
        refUser.set("");
    }

    startGame(startedCallback) {
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
        refAllUsers.once("value", function (snapshot) {
            snapshot.forEach(function (child) {
                let refCurrentUser = refAllUsers.child(child.key);
                refCurrentUser.set({
                    role: "...",
                    lastMove: "...",
                });
            });
        });

        firebase.database().ref(`/rooms/${this.roomCode}/gameStarted`).set(true);
        startedCallback(this.table);
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
