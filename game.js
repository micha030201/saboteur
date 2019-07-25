"use strict"

function doesIncludeArray(haystack, needle){
    let i, j, current;
    for(i = 0; i < haystack.length; ++i){
        if(needle.length === haystack[i].length){
            current = haystack[i];
            for(j = 0; j < needle.length && needle[j] === current[j]; ++j);
            if(j === needle.length)
                return true;
        }
    }
    return false;
}

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
        this.faceHidden = false;
        this._up = up;
        this._down = down;
        this._left = left;
        this._right = right;
    }

    visualize(svg) {
        this.x = 0;
        this.y = 0;

        if (typeof this.elem === "undefined") {
            this.elem = document.createElementNS("http://www.w3.org/2000/svg", "g");

            let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("fill", "black");
            rect.setAttribute("rx", 1);
            rect.setAttribute("width", 10);
            rect.setAttribute("height", 15);
            this.elem.appendChild(rect);

            if (this._up !== "no") {
                let way = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                way.setAttribute("x", 4);
                way.setAttribute("y", 0);
                way.setAttribute("width", 2);
                if (this._up === "yes") {
                    way.setAttribute("height", 8.5);
                } else {
                    way.setAttribute("height", 2);
                }
                way.setAttribute("fill", "red");
                this.elem.appendChild(way);
            }

            if (this._down !== "no") {
                let way = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                way.setAttribute("x", 4);
                way.setAttribute("width", 2);
                if (this._down === "yes") {
                    way.setAttribute("height", 8.5);
                    way.setAttribute("y", 6.5);
                } else {
                    way.setAttribute("height", 2);
                    way.setAttribute("y", 13);
                }
                way.setAttribute("fill", "red");
                this.elem.appendChild(way);
            }

            if (this._left !== "no") {
                let way = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                way.setAttribute("x", 0);
                way.setAttribute("y", 6.5);
                way.setAttribute("height", 2);
                if (this._left === "yes") {
                    way.setAttribute("width", 6);
                } else {
                    way.setAttribute("width", 2);
                }
                way.setAttribute("fill", "red");
                this.elem.appendChild(way);
            }

            if (this._right !== "no") {
                let way = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                way.setAttribute("y", 6.5);
                way.setAttribute("height", 2);
                if (this._right === "yes") {
                    way.setAttribute("width", 6);
                    way.setAttribute("x", 4);
                } else {
                    way.setAttribute("width", 2);
                    way.setAttribute("x", 8);
                }
                way.setAttribute("fill", "red");
                this.elem.appendChild(way);
            }

            this.hideFace = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            this.hideFace.setAttribute("fill", "black");
            this.hideFace.setAttribute("rx", 1);
            this.hideFace.setAttribute("width", 10);
            this.hideFace.setAttribute("height", 15);
            this.elem.appendChild(this.hideFace);

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
        this.elem.setAttribute(
            "transform",
            "rotate(" + (this.reversed ? 180 : 0) + " " + (this.x + cardWidth / 2) + " " + (this.y + cardWidth * 1.5 / 2) + ") "
            + "translate(" + this.x + ", " + this.y + ") "
            + "scale(" + cardWidth / 10 + ") "
        );
        if (this.faceHidden) {
            this.hideFace.setAttribute("opacity", 1);
        } else {
            this.hideFace.setAttribute("opacity", 0);
        }
    }
}

class Field {
    // height -- 7 cards
    // width -- 13 cards
    constructor(finishCard1, finishCard2, finishCard3) {
        this.grid = new DefaultDict(function () { return {}; });
        this.grid[0][0] = new PathCard("yes", "yes", "yes", "yes");

        finishCard1.faceHidden = true;
        finishCard2.faceHidden = true;
        finishCard3.faceHidden = true;

        this.finishCards = [];
        this.finishCards[-2] = finishCard1;
        this.finishCards[0] = finishCard2;
        this.finishCards[2] = finishCard3
    }

    visualize(svg) {
        this.x = 0;
        this.y = 0;

        for (let [a, cardArray] of Object.entries(this.grid)) {
            for (let [b, card] of Object.entries(cardArray)) {
                card.visualize(svg);
            }
        }

        for (let card of Object.values(this.finishCards)) {
            card.visualize(svg);
        }
    }

    _reachableSpaces(visited, _result, x, y, direction) {
        let card = this.grid[x][y];
        if (typeof card === "undefined") {
            _result.push([x, y]);
            return;
        }
        if (card[direction] !== "yes"){
            return;
        }
        if (card.up === "yes" && !visited.has(x + " "+ (y - 1))) {
            visited.add(x + " "+(y - 1));
            this._reachableSpaces(visited, _result, x, y - 1, "down");
        }
        if (card.down === "yes" && !visited.has(x + " " + (y + 1))){
            visited.add(x + " " + (y + 1));
            this._reachableSpaces(visited, _result, x, y + 1, "up");
        }
        if (card.left === "yes" && !visited.has((x - 1) + " " + y)) {
            visited.add((x - 1) + " " + y);
            this._reachableSpaces(visited, _result, x - 1, y, "right");
        }
        if (card.right === "yes" && !visited.has((x + 1) + " " + y)) {
            visited.add((x + 1) + " " + y);
            this._reachableSpaces(visited, _result, x + 1, y, "left");
        }
    }

    reachableSpaces() {
        let result = [ ];
        let visited = new Set (["0 0"]);
        this._reachableSpaces(visited, result, 0, 0, "up");
        return result;
    }

    _canPlaceInPosition(card, x, y) {
        if (
            typeof this.grid[x][y + 1] !== "undefined"
            && ((this.grid[x][y + 1].up !== "no" && card.down === "no")
                || (this.grid[x][y + 1].up === "no" && card.down !== "no"))
        ) {
            return false;
        } else if (
            typeof this.grid[x][y - 1] !== "undefined"
            && ((this.grid[x][y - 1].down !== "no" && card.up === "no")
                || (this.grid[x][y - 1].down === "no" && card.up !== "no"))
        ) {
            return false;
        } else if (
            typeof this.grid[x - 1][y] !== "undefined"
            && ((this.grid[x - 1][y].right !== "no" && card.left === "no")
                || (this.grid[x - 1][y].right === "no" && card.left !== "no"))
        ) {
            return false;
        } else if (
            typeof this.grid[x + 1][y] !== "undefined"
            && ((this.grid[x + 1][y].left !== "no" && card.right === "no")
                || (this.grid[x + 1][y].left === "no" && card.right !== "no"))
        ) {
            return false;
        }
        return true;
    }

    canPlaceInPosition(card, x, y) {
        let prevReversed = card.reversed;

        let result = [];

        card.reversed = false;
        if (this._canPlaceInPosition(card, x, y)) {
            result.push(true);
        } else {
            result.push(false);
        }

        card.reversed = true;
        if (this._canPlaceInPosition(card, x, y)) {
            result.push(true);
        } else {
            result.push(false);
        }

        card.reversed = prevReversed;

        return result;
    }

    availableSpaces(card) {
        let result = [];
        let reachable = this.reachableSpaces();
        for (let [x, y] of reachable) {
            if (this.canPlaceInPosition(card, x, y).any()) {
                result.push([x, y]);
            }
        }
        return result;
    }

    whereCanPlace(card) {
        let [a, b] = this.XYtoAB(card.x, card.y);
        if (doesIncludeArray(this.availableSpaces(card), [a, b])) {
            let [canNotReversed, canReversed] = this.canPlaceInPosition(card, a, b);
            return [a, b, canNotReversed, canReversed]
        }
        return [-1, -1, false, false];
    }

    XYtoAB(x, y) {
        return [
            Math.round((x - cardWidth * 2 - this.x) / cardWidth),
            Math.round((y - cardWidth * 1.5 * 3 - this.y) / (cardWidth * 1.5))
        ];
    }

    ABtoXY(a, b) {
        return [
            cardWidth * 2 + this.x + a * cardWidth,
            cardWidth * 1.5 * 3 + this.y + b * cardWidth * 1.5
        ];
    }

    place(card, a, b) {
        this.grid[a][b] = card;
        for ([a, b] of this.reachableSpaces()) {
            if (a === 8 && (b === 0 || b === 2 || b === -2)) {
                this.finishCards[b].faceHidden = false;
                this.grid[a][b] = this.finishCards[b];
                let [canNotReversed, canReversed] = this.canPlaceInPosition(this.grid[a][b], a, b);
                if (!canNotReversed && canReversed) {
                    this.grid[a][b].reversed = true;
                }
                this.grid[a][b].draw();
            }
        }
    }

    draw() {
        for (let [a, cardArray] of Object.entries(this.grid)) {
            for (let [b, card] of Object.entries(cardArray)) {
                [card.x, card.y] = this.ABtoXY(a, b);
                card.draw();
            }
        }
        [this.finishCards[-2].x, this.finishCards[-2].y] = this.ABtoXY(8, -2);
        [this.finishCards[0].x, this.finishCards[0].y] = this.ABtoXY(8, 0);
        [this.finishCards[2].x, this.finishCards[2].y] = this.ABtoXY(8, 2);
        this.finishCards[-2].draw();
        this.finishCards[0].draw();
        this.finishCards[2].draw();
    }
}

class Hand {
    // if ours:
    //     width -- 10 cards
    //     height -- 1 card
    // otherwise:
    //     width -- 3 cards
    //     height -- 2 cards
    constructor(is_ours) {
        this.is_ours = is_ours;
        this.cards = [];
    }

    visualize(svg) {
        this.x = 0;
        this.y = 0;

        for (let card of this.cards) {
            card.visualize(svg);
        }
    }

    pickCard(x, y) {
        for (let card of this.cards) {
            if (
                    card.x < x
                    && x < (card.x + cardWidth)
                    && card.y < y
                    && y < (card.y + cardWidth * 1.5)) {
                return card;
            }
        }
    }

    removeCard(card) {
        let index = this.cards.indexOf(card);
        if (index > -1) {
            this.cards.splice(index, 1);
        }
    }

    draw() {
        let x = this.x;
        for (let card of this.cards) {
            card.y = this.y;
            card.x = x;
            if (this.is_ours) {
                x += cardWidth;
            } else {
                x += 3 / (this.cards.length + 1);
            }
            card.draw();
        }
    }
}

let svg;
let field = new Field(
    new PathCard("yes", "no", "no", "yes"),
    new PathCard("yes", "no", "no", "yes"),
    new PathCard("yes", "no", "no", "yes"),
);
let ourHand = new Hand(true);
ourHand.cards = [
    new PathCard("yes", "dead end", "yes", "no"),
    new PathCard("no", "no", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
    new PathCard("yes", "yes", "yes", "yes"),
]

document.addEventListener('DOMContentLoaded', function() {
    svg = document.getElementById("gamearea");

    ourHand.visualize(svg);
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

    ourHand.x = xOffset + cardWidth;
    ourHand.y = field.y + cardWidth * 1.5 * 8;

    field.draw();
    ourHand.draw();
}

let draggedCard = null;
let draggedCardFlipTimer = null;
let draggedCardFlipLastPosition = [-99, -99];
document.addEventListener('mousedown', function(e) {
    if (draggedCard === null) {
        draggedCard = ourHand.pickCard(e.clientX, e.clientY);
        if (typeof draggedCard === "undefined") {
            draggedCard = null;
            return;
        }
        ourHand.removeCard(draggedCard);

        ourHand.draw();
        draggedCard.x = e.clientX - cardWidth / 2;
        draggedCard.y = e.clientY - cardWidth * 1.5 / 2;
        draggedCard.draw();
    } else {
        let [a, b, canNotReversed, canReversed] = field.whereCanPlace(draggedCard);
        if ((canNotReversed && !draggedCard.reversed) || (canReversed && draggedCard.reversed)) {
            // card already in the correct orientation
        } else if (canNotReversed) {
            draggedCard.reversed = false;
        } else if (canReversed) {
            draggedCard.reversed = true;
        }
        if (canNotReversed || canReversed) {
            field.place(draggedCard, a, b);
            draggedCard = null;
            clearInterval(draggedCardFlipTimer);
            field.draw();
        }
    }
});


document.addEventListener('mousemove', function(e) {
    if (draggedCard === null) {
        return;
    }
    draggedCard.x = e.clientX - cardWidth / 2;
    draggedCard.y = e.clientY - cardWidth * 1.5 / 2;

    let [a, b, canNotReversed, canReversed] = field.whereCanPlace(draggedCard);
    let [x, y] = field.ABtoXY(a, b);
    if (canNotReversed && canReversed && draggedCardFlipLastPosition[0] === a && draggedCardFlipLastPosition[1] === b) {
        if (draggedCardFlipTimer !== null) {
            clearInterval(draggedCardFlipTimer);
        }
        draggedCardFlipTimer = setInterval(function () {
            draggedCard.reversed = !draggedCard.reversed;
            draggedCard.draw();
        }, 1300);
    } else if (canNotReversed) {
        clearInterval(draggedCardFlipTimer);
        draggedCard.reversed = false;
    } else if (canReversed) {
        clearInterval(draggedCardFlipTimer);
        draggedCard.reversed = true;
    }

    if (canNotReversed || canReversed) {
        draggedCard.x = x;
        draggedCard.y = y;
    }
    draggedCardFlipLastPosition = [a, b];
    draggedCard.draw();
});
