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
    constructor(svg, up, down, left, right) {
        this.elem = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        this.elem.setAttribute("fill", "black");
        svg.appendChild(this.elem);

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

class Field {
    // height -- 7 cards
    // width -- 13 cards
    constructor(svg, finishCard1, finishCard2, finishCard3) {
        this.x = 0;
        this.y = 0;

        this.grid = new DefaultDict(function () { return {}; });
        this.grid[0][0] = new PathCard(svg, "yes", "yes", "yes", "yes");
        this.grid[8][0] = finishCard1;
        this.grid[8][2] = finishCard2;
        this.grid[8][-2] = finishCard3;
    }

    get height() {
        return this.width / 13 * 1.5 * 7;
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

    draw() {
        for (let [x, cardArray] of Object.entries(this.grid)) {
            for (let [y, card] of Object.entries(cardArray)) {
                card.elem.setAttribute("width", cardWidth);
                card.elem.setAttribute("height", cardWidth * 1.5);

                card.elem.setAttribute("x", cardWidth * 2 + this.x + x * cardWidth);
                card.elem.setAttribute("y", cardWidth * 1.5 * 3 + this.y + y * cardWidth * 1.5);
            }
        }
    }
}

let svg, field;
document.addEventListener('DOMContentLoaded', function(){
    svg = document.getElementById("gamearea");

    field = new Field(
        svg,
        new PathCard(svg, "yes", "yes", "yes", "yes"),
        new PathCard(svg, "yes", "yes", "yes", "yes"),
        new PathCard(svg, "yes", "yes", "yes", "yes"),
    );

    redraw();
});

let cardWidth;
function redraw() {
    svg.setAttribute("width", window.innerWidth);
    svg.setAttribute("height", window.innerHeight);
    svg.setAttribute("viewBox", "0 0 " + window.innerWidth + " " + window.innerHeight);

    let margin = Math.min(window.innerWidth, window.innerHeight) * 0.04;
    let xOffset, yOffset;

    if (window.innerHeight * 14 * 1.5 <= window.innerWidth * 13) {
        cardWidth = (window.innerHeight - margin * 2) / 14 / 1.5;
        xOffset = (window.innerWidth - cardWidth * 13) / 2;
        yOffset = margin;
    } else {
        cardWidth = (window.innerWidth - margin * 2) / 13;
        xOffset = margin;
        yOffset = (window.innerHeight - cardWidth * 1.5 * 14) / 2;
    }

    // TODO other players' hands

    field.x = xOffset;
    field.y = yOffset + cardWidth * 1.5 * 3;

    // TODO our hand

    field.draw();
}
