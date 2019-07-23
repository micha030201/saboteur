"use strict"

class DefaultDict {
    constructor(defaultInit) {
        return new Proxy({}, {
            get: (target, name) => name in target ?
                target[name] :
                (target[name] = typeof defaultInit === 'function' ?
                    new defaultInit().valueOf() :
                    defaultInit)
        })
    }
}

Array.prototype.any = function() {
    return this.some(function(x) { return x });
}

class PathCard {
    constructor(up, down, left, right) {
        this.reversed = false;
        this._up = up;
        this._down = down;
        this._left = left;
        this._right = right;
    }

    get up() {
        if (this.reversed) {
            return this._down;
        }
        return this._up;
    }

    get down() {
        if (this.reversed) {
            return this._up;
        }
        return this._down;
    }

    get left() {
        if (this.reversed) {
            return this._right;
        }
        return this._left;
    }

    get right() {
        if (this.reversed) {
            return this._left;
        }
        return this._right;
    }
}

let TURNEDCARD = 123;

class Field {
    constructor(finishCard1, fiinshCard2, finishCard3) {
        this.grid = new DefaultDict(function () { return {}; });
        this.grid[0][0] = new PathCard("yes", "yes", "yes", "yes");
        this.finishCards = [finishCard1, fiinshCard2, finishCard3];
        this.grid[8][0] = TURNEDCARD;
        this.grid[8][2] = TURNEDCARD;
        this.grid[8][-2] = TURNEDCARD;
    }

    _reachableSpaces(_result, x, y) {
        let card = this.grid[x][y];
        if (typeof card === "undefined") {
            _result.push([x, y]);
        }
        if (card.up === "yes") {
            this._reachableSpaces(_result, x - 1, y);
        }
        if (card.down === "yes") {
            this._reachableSpaces(_result, x + 1, y);
        }
        if (card.left === "yes") {
            this._reachableSpaces(_result, x, y - 1);
        }
        if (card.right === "yes") {
            this._reachableSpaces(_result, x, y + 1);
        }
    }

    reachableSpaces() {
        let result = [];
        this._reachableSpaces(result, 0, 0);
        return result;
    }

    _canPlace(card, x, y) {
        if (
            typeof this.grid[x][y - 1] != "undefined"
            && ((this.grid[x][y - 1].down != "no" && card.up === "no")
                || (this.grid[x][y - 1].down === "no" && card.up != "no"))
        ) {
            return false;
        } else if (
            typeof this.grid[x][y + 1] != "undefined"
            && ((this.grid[x][y + 1].up != "no" && card.down === "no")
                || (this.grid[x][y + 1].up === "no" && card.down != "no"))
        ) {
            return false;
        } else if (
            typeof this.grid[x - 1][y] != "undefined"
            && ((this.grid[x - 1][y].right != "no" && card.left === "no")
                || (this.grid[x - 1][y].right === "no" && card.left != "no"))
        ) {
            return false;
        } else if (
            typeof this.grid[x + 1][y] != "undefined"
            && ((this.grid[x + 1][y].left != "no" && card.right === "no")
                || (this.grid[x + 1][y].left === "no" && card.right != "no"))
        ) {
            return false;
        }
        return true;
    }

    canPlace(card, x, y) {
        let prevReversed = card.reversed;

        let result = [];
        if (this._canPlace(card, x, y)) {
            result.push(true);
        } else {
            result.push(false);
        }

        card.reversed = !card.reversed;
        if (this._canPlace(card, x, y)) {
            result.push(true);
        } else {
            result.push(false);
        }
        card.reversed = !card.reversed;

        return result;
    }

    availableSpaces(card) {
        let result = [];
        let reachable = this.reachableSpaces();
        for (let [x, y] of reachable) {
            if (canPlace(card, x, y).any) {
                result.push([x, y]);
            }
        }
        return result;
    }

    place(card, x, y) {
    }
}
