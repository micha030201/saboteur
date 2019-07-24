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

    visualize(svg) {
        if (typeof this.elem === "undefined") {
            this.elem = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            this.elem.setAttribute("fill", "black");
            svg.appendChild(this.elem);
        }
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

    draw() {
        this.elem.setAttribute("width", cardWidth);
        this.elem.setAttribute("height", cardWidth * 1.5);
    }
}

class Field {
    // height -- 7 cards
    // width -- 13 cards
    constructor(finishCard1, finishCard2, finishCard3) {
        this.x = 0;
        this.y = 0;

        this.grid = new DefaultDict(function () { return {}; });
        this.grid[0][0] = new PathCard("yes", "yes", "yes", "yes");
        this.grid[8][0] = finishCard1;
        this.grid[8][2] = finishCard2;
        this.grid[8][-2] = finishCard3;
    }

    visualize(svg) {
        for (let [x, cardArray] of Object.entries(this.grid)) {
            for (let [y, card] of Object.entries(cardArray)) {
                card.visualize(svg);
            }
        }
    }

    _reachableSpaces(set, _result, x, y) {
        let card = this.grid[x][y];
        if (typeof card === "undefined") {
            _result.push([x, y]);
            return;
        }
        if (card.up === "yes" && !set.has(x + " " + (y + 1))) {
        	set.add(x + " " + (y + 1));
            this._reachableSpaces(set, _result, x, y + 1);
            
        }
        if (card.down === "yes" && !set.has(x + " "+ (y - 1))) {
        	set.add(x + " "+(y - 1));
            this._reachableSpaces(set, _result, x, y - 1);
        }
        if (card.left === "yes" && !set.has((x - 1) + " " + y)) {
        	set.add((x - 1) + " " + y);
            this._reachableSpaces(set, _result, x - 1, y);
        }
        if (card.right === "yes" && !set.has((x + 1) + " " + y)) {
        	set.add((x + 1) + " " + y);
            this._reachableSpaces(set, _result, x + 1, y);
        }
    }

    reachableSpaces() {
        let result = [ ];
        let set = new Set (["0 0"]);
        this._reachableSpaces(set, result, 0, 0);
        return result;
    }

    _canPlace(card, x, y) {
        if (
            typeof this.grid[x][y - 1] != "undefined"
            && ((this.grid[x][y - 1].up != "no" && card.down === "no")
                || (this.grid[x][y - 1].up === "no" && card.down != "no"))
        ) {
            return false;
        } else if (
            typeof this.grid[x][y + 1] != "undefined"
            && ((this.grid[x][y + 1].down != "no" && card.up === "no")
                || (this.grid[x][y + 1].down === "no" && card.up != "no"))
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
            if (this.canPlace(card, x, y).any()) {
                result.push([x, y]);
            }
        }        
        return result;
    }

    place(card, x, y) {
    	this.grid[x][y] = card;
    	console.log("cardplaced :", x, y);
    }

    draw() {
        for (let [x, cardArray] of Object.entries(this.grid)) {
            for (let [y, card] of Object.entries(cardArray)) {
                card.draw();

                card.elem.setAttribute("x", cardWidth * 2 + this.x + x * cardWidth);
                card.elem.setAttribute("y", cardWidth * 1.5 * 3 + this.y + y * cardWidth * 1.5);
            }
        }
    }
}

let svg;
let field = new Field(
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
);

document.addEventListener('DOMContentLoaded', function(){
    svg = document.getElementById("gamearea");

    field.visualize(svg);
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
