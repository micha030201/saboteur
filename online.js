"use strict"
/* global firebase Player Move shuffle cardIndices */

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


class NetGame {
    constructor() {
        this.onPlayerAdd = () => {};
    }

    _onPlayerAdd(snapshot) {
        let player = new Player(snapshot.key);
        this.onPlayerAdd(player);
    }

    createGame() {
        this.roomCode = firebase.database().ref("/rooms").push().key;
        let refAllUsers = firebase.database().ref(`/rooms/${this.roomCode}/users`);
        refAllUsers.on("child_added", this._onPlayerAdd.bind(this));
    }

    joinGame(roomCode, foundCallback, startedCallback) {
        // FIXME what if the supplied room code has a forward-slash?
        this.roomCode = roomCode;
        this.startedCallback = startedCallback;

        let refAllRooms = firebase.database().ref("/rooms");
        refAllRooms.once("value")
            .then(function(snapshot) {
                foundCallback(snapshot.hasChild(roomCode));
            });

        let refAllUsers = firebase.database().ref(`/rooms/${roomCode}/users`);
        refAllUsers.on("child_added", this._onPlayerAdd.bind(this));

        // TODO on game started call callback
    }

    addPlayer(player) {
        let refUser = firebase.database().ref(`/rooms/${this.roomCode}/users/${player.name}`);
        refUser.set("");
    }

    startGame() {
        let finishCards = [1, 2, 3];
        shuffle(finishCards);
        let refRoom = firebase.database().ref(`/rooms/${this.roomCode}`);
        refRoom.update( {
            field: {
                0: "0, 0"
            },
            deck: cardIndices,
            finishCards: finishCards,
            //allMoves
        });

        let refAllUsers = firebase.database().ref(`/rooms/${this.roomCode}/users`);
        refAllUsers.once("value", function (snapshot) {
            snapshot.forEach(function (child) {
                let refCurrentUser = refAllUsers.child(child.key);
                refCurrentUser.set({
                    role: "...",
                    //lastMove
                    hand: "..."
                });
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

    addMoveReceiver(player, oldMove, callback) {
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

let game = new NetGame();

document.addEventListener("DOMContentLoaded", function() {
    $("#newRoom").click(function() {
        game.onPlayerAdd = function(name) { console.log(name); };

        let player = new Player(null, document.getElementById("name").value);
        game.createGame();
        game.addPlayer(player);

    });

    $("#startGame").click(function() {game.startGame()});

    $("#addUser").click(function() {
        game.onPlayerAdd = function(name) { console.log(name); };
        let roomCode = document.getElementById("roomCode").value;

        game.joinGame(roomCode);
    });


    $("#sendMove").click(function() {
        let move = new Move();
        let player = new Player(null, document.getElementById("name").value);
        move.discard(document.getElementById("newCard").value * 1);
        game.sendMove(player, move);
    });

    $("#receiveMove").click(function() {
        let move = new Move();
        let player = new Player(null, document.getElementById("name").value);
        move.discard(6);
        game.addMoveReceiver(player, move, console.log);
    });
});


