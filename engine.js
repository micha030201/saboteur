"use strict"
/* global dirs impairmentType finishCardIndex DefaultDict doesIncludeArray */
/* exported symmetrical Table Player Move */

function symmetrical(card) {
    return (dirs(card).up === dirs(card).down && dirs(card).left === dirs(card).right);
}

class Table {
    constructor() {
        this.players = [];

        this.finishCards = [];
        this.deck = [];
        this.discardPile = [];
        this.moveCallback = () => {};

        this.goldFound = false;

        this.field = new Field();
    }

    get gameOver() {
        if (this.goldFound) {
            return true;
        }

        let cardsHeld = 0;
        for (let player of this.players) {
            cardsHeld += player.hand.length;
        }
        cardsHeld += this.deck.length;
        return !cardsHeld;
    }

    nextPlayer(player) {
        let index = this.players.indexOf(player);
        index--;
        if (index < 0) {
            index += this.players.length;
        }
        return this.players[index];
    }

    processRepairMove(player, move) {
        let affectedPlayer = this.players[move.playerId];

        let impairmentCard = affectedPlayer.impairments[impairmentType(move.card)];
        affectedPlayer.impairments[impairmentType(move.card)] = null;

        this.discardPile.push(impairmentCard);
        this.discardPile.push(move.card);
    }

    processImpairMove(player, move) {
        let affectedPlayer = this.players[move.playerId];
        affectedPlayer.impairments[impairmentType(move.card)] = move.card;
    }

    processLookMove(player, move) {
        player.seenFinishCards[move.index] = true;
        this.discardPile.push(move.card);
    }

    processDestroyMove(player, move) {
        let card = this.field.remove(move.a, move.b);
        this.discardPile.push(move.card);
        this.discardPile.push(card);
    }

    processPlaceMove(player, move) {
        this.field.place(move.card, move.a, move.b);
        for (let [a, b] of this.field.reachableSpaces()) {
            let index = finishCardIndex[a][b];
            if (typeof index !== "undefined") {
                let card = this.finishCards[index];
                if (Math.abs(card) === 1) {
                    this.goldFound = true;
                }
                this.finishCards[index] = null;
                if (this.field.evaluateOrientation(-card, a, b) > this.field.evaluateOrientation(card, a, b)) {
                    card = -card;
                }
                this.field.place(card, a, b);
            }
        }
    }

    processDiscardMove(player, move) {
        this.discardPile.push(move.card);
    }

    processMove(player, move, fastForward) {
        player.hand = player.hand.filter(item => Math.abs(item) !== Math.abs(move.card));

        if (move.type === "place") {
            this.processPlaceMove(player, move);
        } else if (move.type === "discard") {
            this.processDiscardMove(player, move);
        } else if (move.type === "destroy") {
            this.processDestroyMove(player, move);
        } else if (move.type === "look") {
            this.processLookMove(player, move);
        } else if (move.type === "impair") {
            this.processImpairMove(player, move);
        } else if (move.type === "repair") {
            this.processRepairMove(player, move);
        }
        if (this.deck.length) {
            player.drawCard();
        }

        let nextPlayer = this.nextPlayer(player);
        if (!fastForward) {
            this.moveCallback(move, player, () => {
                if (nextPlayer.hand.length && !this.gameOver) {
                    nextPlayer.makeMove(this.processMove.bind(this, nextPlayer));
                }
            });
        }
    }

    initializeGame() {
        for (let player of this.players) {
            for (let i = 0; i < 5; ++i) {
                player.drawCard();
            }
        }
    }

    resumeGame(lastPlayer) {
        let move = new Move();
        move.noop();

        let nextPlayer = this.nextPlayer(lastPlayer);
        this.moveCallback(move, lastPlayer);
        nextPlayer.makeMove(this.processMove.bind(this, nextPlayer));
    }
}

class Player {  // base class
    constructor(netgame, table, name) {
        this.netgame = netgame;
        this.table = table;
        this.name = name;
        this.role = "[DATA EXPUNGED]";
        this.hand = [];
        this.seenFinishCards = [false, false, false];
        this.impairments = [null, null, null];
    }

    drawCard() {
        this.hand.push(this.table.deck.pop());
    }

    makeMove(callback) { }
}

class Move {
    noop() {
        this.type = "noop";
    }

    placeCard(card, a, b) {
        this.type = "place";
        this.card = card;
        this.a = a;
        this.b = b;
    }

    discard(card) {
        this.type = "discard";
        this.card = card;
    }

    equals(that) {
        for (let [key, value] of Object.entries(this)) {
            if (that[key] !== value) {
                return false;
            }
        }
        return true;
    }

    destroy(card, a, b) {
        this.type = "destroy";
        this.card = card;
        this.a = a;
        this.b = b;
    }

    look(card, finishCardIndex) {
        this.type = "look";
        this.card = card;
        this.index = finishCardIndex;
    }

    impair(card, player) {
        this.type = "impair";
        this.card = card;
        this.playerId = player.id;
    }

    repair(card, player) {
        this.type = "repair";
        this.card = card;
        this.playerId = player.id;
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
         if (Math.abs(b) > 3 || a < -2 || a > 10){
            return;
         }
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

    canPlaceInPosition(card, a, b) {
        let fit = function(neighbour, dir_n, card, dir_c) {
            return (
                typeof neighbour === "undefined"
                || ((dirs(neighbour)[dir_n] === "no" && dirs(card)[dir_c] === "no")
                    || (dirs(neighbour)[dir_n] !== "no" && dirs(card)[dir_c] !== "no"))
            );
        };

        return [
            fit(this.grid[a][b + 1], 'up', card, 'down'),
            fit(this.grid[a][b - 1], 'down', card, 'up'),
            fit(this.grid[a + 1][b], 'left', card, 'right'),
            fit(this.grid[a - 1][b], 'right', card, 'left'),
        ];
    }

    evaluateOrientation(card, a, b) {
        let fit = function(neighbour, dir_n, card, dir_c) {
            return (
                typeof neighbour !== "undefined"
                && (dirs(neighbour)[dir_n] !== "no" && dirs(card)[dir_c] !== "no")
            ) ? 1 : 0;
        };

        return (
            fit(this.grid[a][b + 1], 'up', card, 'down')
            + fit(this.grid[a][b - 1], 'down', card, 'up')
            + fit(this.grid[a + 1][b], 'left', card, 'right')
            + fit(this.grid[a - 1][b], 'right', card, 'left')
        );
    }

    static isInside(a, b) {
        return (
            (-5 < a && a < 13) &&
            (-7 < b && b < 7)
        );
    }

    availableSpaces(card) {
        let result = [];
        let reachable = this.reachableSpaces();
        for (let [a, b] of reachable) {
            if (
                Field.isInside(a, b)
                && this.canPlaceInPosition(card, a, b).all()
            ) {
                result.push([a, b]);
            }
        }
        return result;
    }

    canBePlaced(card, a, b) {
        return doesIncludeArray(this.availableSpaces(card), [a, b]);
    }

    place(card, a, b) {
        this.grid[a][b] = card;
    }

    canBeRemoved(a, b) {
        if (a === 0 && b === 0) {
            return false;
        }
        if (typeof this.grid[a][b] !== "undefined") {
            return true;
        }
        return false;
    }

    remove(a, b) {
        let card = this.grid[a][b];
        delete this.grid[a][b];
        return card;
    }
}
