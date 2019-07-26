"use strict"
/* global dirs DefaultDict doesIncludeArray */
/* exported Table Player Move */

class Table {  // in the most unlikely scenario you still have time for that, rewrite so that it can get finish cards from the server
    constructor() {
        this.players = [];
        this.currentPlayer = 0;

        this.finishCards = [];
        this.deck = [];
        this.moveCallback = () => {};

        this.field = new Field();
    }

    nextPlayer() {
        this.currentPlayer--;
        if (this.currentPlayer < 0) {
            this.currentPlayer += this.players.length;
        }
        return this.players[this.currentPlayer];
    }

    processPlaceMove(move) {
        this.field.place(move.card, move.a, move.b);
        for (let [a, b] of this.field.reachableSpaces()) {
            if (a === 8 && (b === 0 || b === 2 || b === -2)) {
                let card = Math.abs(this.finishCards[(b + 2) / 2]);
                this.finishCards[(b + 2) / 2] = null;
                let [canNotReversed, canReversed] = this.field.canPlaceInPosition(card, a, b);
                if (!canNotReversed && canReversed) {
                    card = -card;
                }
                this.field.place(card, a, b);
            }
        }
    }

    processMove(player, move) {
        if (move.type === "place") {
            this.processPlaceMove(move);
        }
        if (this.deck.length) {
            player.drawCard();
        }
        this.moveCallback();
        let nextPlayer = this.nextPlayer();
        nextPlayer.makeMove(this.processMove.bind(this, nextPlayer));
    }

    startGame() {
        for (let player of this.players) {
            for (let i = 0; i < 5; ++i) {
                player.drawCard();
            }
        }
        // ready player minus one, i guess
        let nextPlayer = this.nextPlayer();
        this.moveCallback();
        nextPlayer.makeMove(this.processMove.bind(this, nextPlayer));
    }
}

class Player {  // base class
    constructor(table, name, allegiance) {
        this.table = table;
        this.name = name;
        this.allegiance = allegiance;
        this.hand = [];
        //this.breakage
    }

    drawCard() {
        this.hand.push(this.table.deck.pop());
    }

    makeMove(callback) { }
}

class Move {
    placeCard(card, a, b) {
        this.type = "place";
        this.card = card;
        this.a = a;
        this.b = b;
    }
}

class Field {
    constructor() {
        this.grid = new DefaultDict(function () { return {}; });
        this.grid[0][0] = 0;
    }

    *cards() {
        for (let [a, cardArray] of Object.entries(this.grid)) {
            for (let [b, card] of Object.entries(cardArray)) {
                yield [a, b, card];
            }
        }
    }

    _reachableSpaces(_visited, _result, a, b, direction) {
        let card = this.grid[a][b];
        if (typeof card === "undefined") {
            _result.push([a, b]);
            return;
        }
        if (dirs(card)[direction] !== "yes"){
            return;
        }
        if (dirs(card).up === "yes" && !_visited.has(a + " " + (b - 1))) {
            _visited.add(a + " " + (b - 1));
            this._reachableSpaces(_visited, _result, a, b - 1, "down");
        }
        if (dirs(card).down === "yes" && !_visited.has(a + " " + (b + 1))){
            _visited.add(a + " " + (b + 1));
            this._reachableSpaces(_visited, _result, a, b + 1, "up");
        }
        if (dirs(card).left === "yes" && !_visited.has((a - 1) + " " + b)) {
            _visited.add((a - 1) + " " + b);
            this._reachableSpaces(_visited, _result, a - 1, b, "right");
        }
        if (dirs(card).right === "yes" && !_visited.has((a + 1) + " " + b)) {
            _visited.add((a + 1) + " " + b);
            this._reachableSpaces(_visited, _result, a + 1, b, "left");
        }
    }

    reachableSpaces() {
        let result = [];
        let visited = new Set(["0 0"]);
        this._reachableSpaces(visited, result, 0, 0, "up");
        return result;
    }

    _canPlaceInPosition(card, a, b) {
        let fit = function(neighbour, dir_n, card, dir_c) {
            return (
                typeof neighbour === "undefined"
                || ((dirs(neighbour)[dir_n] === "no" && dirs(card)[dir_c] === "no")
                    || (dirs(neighbour)[dir_n] !== "no" && dirs(card)[dir_c] !== "no"))
            );
        };

        return (
            fit(this.grid[a][b + 1], 'up', card, 'down')
            && fit(this.grid[a][b - 1], 'down', card, 'up')
            && fit(this.grid[a + 1][b], 'left', card, 'right')
            && fit(this.grid[a - 1][b], 'right', card, 'left')
        );
    }

    canPlaceInPosition(card, a, b) {
        return [
            this._canPlaceInPosition(Math.abs(card), a, b),
            this._canPlaceInPosition(-Math.abs(card), a, b)
        ];
    }

    availableSpaces(card) {
        let result = [];
        let reachable = this.reachableSpaces();
        for (let [a, b] of reachable) {
            if (
                (-3 < a && a < 11)
                && (-4 < b && b < 4)
                && this.canPlaceInPosition(card, a, b).any()
            ) {
                result.push([a, b]);
            }
        }
        return result;
    }

    canBePlaced(card, a, b) {
        if (doesIncludeArray(this.availableSpaces(card), [a, b])) {
            let [canNotReversed, canReversed] = this.canPlaceInPosition(card, a, b);
            return [canNotReversed, canReversed]
        }
        return [false, false];
    }

    place(card, a, b) {
        this.grid[a][b] = card;
    }
}
