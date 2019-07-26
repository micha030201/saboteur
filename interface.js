"use strict"
/* global dirs DefaultDict Table Player Move shuffle cardIndices */

let finishMoveCallback = null;
class OurPlayer extends Player {
    makeMove(callback) {
        console.log("player");
        finishMoveCallback = callback;
    }
}

class BotPlayer extends Player {
    makeMove(callback) {
        console.log(this.name);

        let spaces = [], card;
        while (!spaces.length) {
            shuffle(this.hand);
            card = this.hand[this.hand.length - 1];
            spaces = this.table.field.availableSpaces(card);
        }
        this.hand.pop();
        let [a, b] = spaces.randomElement();
        if (this.table.field.canBePlaced(card, a, b)[0]) {
            card = Math.abs(card);
        } else {
            card = -Math.abs(card);
        }
        let move = new Move();
        move.placeCard(card, a, b);

        setTimeout(() => callback(move), 300);
    }
}

let svg, table, we;

document.addEventListener('DOMContentLoaded', function() {
    svg = document.getElementById("gamearea");

    table = new Table();

    we = new OurPlayer(table, "me", "honest");
    let bot = new BotPlayer(table, "connor", "saboteur");
    let bot2 = new BotPlayer(table, "dummy plug", "saboteur");

    table.players = [we, bot, bot2];
    table.deck = shuffle(cardIndices);
    table.finishCards = [1, 2, 3];

    table.moveCallback = draw.bind(null, table, we);

    table.startGame();
});

let cardWidth;

let draggedCard = null;
let draggedCardFlipTimer = null;
let draggedCardFlipLastA, draggedCardFlipLastB;


function XYtoAB(x, y) {
    return [
        Math.round((x - cardWidth * 2 - fieldOffsetX) / cardWidth),
        Math.round((y - cardWidth * 1.5 * 3 - fieldOffsetY) / (cardWidth * 1.5))
    ];
}

function ABtoXY(a, b) {
    return [
        cardWidth * 2 + fieldOffsetX + a * cardWidth,
        cardWidth * 1.5 * 3 + fieldOffsetY + b * cardWidth * 1.5
    ];
}

document.addEventListener('mousemove', function(e) {
    if (draggedCard === null) {
        return;
    }
    let x = e.clientX - cardWidth / 2;
    let y = e.clientY - cardWidth * 1.5 / 2;

    let [a, b] = XYtoAB(x, y);
    let [canNotReversed, canReversed] = table.field.canBePlaced(draggedCard, a, b);
    let [snapX, snapY] = ABtoXY(a, b);
    if (draggedCardFlipLastA !== a || draggedCardFlipLastB !== b) {
        clearInterval(draggedCardFlipTimer);
    }
    if (canNotReversed && canReversed) {
        if (draggedCardFlipLastA !== a || draggedCardFlipLastB !== b) {
            draggedCardFlipTimer = setInterval(function () {
                draggedCard = -draggedCard;
                drawCard(draggedCard, x, y);
            }, 1300);
        }
    } else if (canNotReversed) {
        clearInterval(draggedCardFlipTimer);
        draggedCard = Math.abs(draggedCard);
    } else if (canReversed) {
        clearInterval(draggedCardFlipTimer);
        draggedCard = -Math.abs(draggedCard);
    } else {
        clearInterval(draggedCardFlipTimer);
    }

    if (canNotReversed || canReversed) {
        x = snapX;
        y = snapY;
    }

    draggedCardFlipLastA = a;
    draggedCardFlipLastB = b;
    drawCardOnTop(draggedCard, x, y, false, true);
});

window.addEventListener('resize', function() {
    draw(table, we);
});

let fieldOffsetX, fieldOffsetY;
let drawCache = {
    width: 0,
    height: 0,

    field: {},

    cardData: new DefaultDict(function () { return {}; }),
    cardStandInData: new DefaultDict(function () { return {}; }),
};
function draw(table, we) {
    if (drawCache.width !== window.innerWidth || drawCache.height !== window.innerHeight) {
        svg.setAttribute("width", window.innerWidth);
        svg.setAttribute("height", window.innerHeight);
        svg.setAttribute("viewBox", "0 0 " + window.innerWidth + " " + window.innerHeight);
    }

    let margin = Math.min(window.innerWidth, window.innerHeight) * 0.04;
    let offsetX, offsetY;

    if (window.innerHeight / 14 / 1.5 <= window.innerWidth / 13) {
        cardWidth = (window.innerHeight - margin * 2) / 14 / 1.5;
        offsetX = (window.innerWidth - cardWidth * 13) / 2;
        offsetY = margin;
    } else {
        cardWidth = (window.innerWidth - margin * 2) / 13;
        offsetX = margin;
        offsetY = (window.innerHeight - cardWidth * 1.5 * 14) / 2;
    }

    drawField(table.field, offsetX, offsetY + cardWidth * 1.5 * 3);

    let otherHandOffsetX = 0;
    for (let player of table.players) {
        if (player !== we) {
            drawOtherHand(player, offsetX + cardWidth * 4 * otherHandOffsetX++, offsetY);
        }
    }

    drawDeck(table.deck, offsetX + cardWidth * 12, offsetY);
    drawOurHand(we, offsetX, offsetY + cardWidth * 1.5 * 11);
}

function drawOtherHand(player, offsetX, offsetY) {
    let x = offsetX;
    for (let card of player.hand) {
        drawCard(card, x, offsetY, true);
        x += cardWidth / 3;
    }
}

function drawDeck(deck, offsetX, offsetY) {
    for (let card of deck) {
        drawCard(card, offsetX, offsetY, true);
    }
}

function drawField(field, offsetX, offsetY) {
    fieldOffsetX = offsetX;
    fieldOffsetY = offsetY;

    if (
        drawCache.field.offsetX !== offsetX
        || drawCache.field.offsetY !== offsetY
        //|| cardWidth !== drawCache
    ) {
        if (typeof drawCache.field.elem === "undefined") {
            drawCache.field.elem = makeElemForField();
            svg.appendChild(drawCache.field.elem);
        }
        drawCache.field.elem.setAttribute("x", offsetX);
        drawCache.field.elem.setAttribute("y", offsetY);

        drawCache.field.elem.setAttribute("width", cardWidth * 13);
        drawCache.field.elem.setAttribute("height", cardWidth * 1.5 * 7);

        drawCache.field.offsetX = offsetX;
        drawCache.field.offsetY = offsetY;
    }

    let x, y;
    if (table.finishCards[0] !== null) {
        [x, y] = ABtoXY(8, -2);
        drawCard(table.finishCards[0], x, y, true);
    }
    if (table.finishCards[1] !== null) {
        [x, y] = ABtoXY(8, 0);
        drawCard(table.finishCards[1], x, y, true);
    }
    if (table.finishCards[2] !== null) {
        [x, y] = ABtoXY(8, 2);
        drawCard(table.finishCards[2], x, y, true);
    }

    for (let [a, b, card] of field.cards()) {
        [x, y] = ABtoXY(a, b);
        drawCard(card, x, y);
    }
}

function makeElemForField() {
    let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("fill", "gainsboro");
    rect.setAttribute("rx", 5);

    return rect;
}

function drawCard(card, x, y, hidden, doNotAnimate) {
    let reversed = card < 0;
    card = Math.abs(card);

    let c = drawCache.cardData[card];
    if (typeof c.elem === "undefined") {
        c.elem = makeElemForCard(card);
        svg.appendChild(c.elem[1]);
    }

    if (
        c.reversed !== reversed
        || c.hidden !== hidden
        || c.x !== x
        || c.y !== y
        || c.width !== cardWidth
    ) {
        svg.appendChild(c.elem[1]);  // HACK

        c.elem[0].setAttribute("opacity", hidden ? 1 : 0);

        if (typeof c.x === "undefined" || doNotAnimate) {
            c.elem[2].setAttribute("from", x + ", " + y);
        } else {
            c.elem[2].setAttribute("from", c.x + ", " + c.y);
        }
        c.elem[2].setAttribute("to", x + ", " + y);
        c.elem[2].beginElement();

        c.elem[3].setAttribute(
            "transform",
            "scale(" + cardWidth / 10 + ") "
            + "rotate(" + (reversed ? 180 : 0) + " " + (10 / 2) + " " + (10 * 1.5 / 2) + ")"
        );

        c.reversed = reversed;
        c.hidden = hidden;
        c.x = x
        c.y = y
        c.width = cardWidth
    }

    return c.elem;
}

function drawCardOnTop(card, x, y, hidden, doNotAnimate) {
    svg.appendChild(drawCard(card, x, y, hidden, doNotAnimate)[1]);
}

function makeElemForCard(card) {
    let elem = document.createElementNS("http://www.w3.org/2000/svg", "g");

    let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("fill", "black");
    rect.setAttribute("rx", 1);
    rect.setAttribute("width", 10);
    rect.setAttribute("height", 15);
    elem.appendChild(rect);

    if (dirs(card).up !== "no") {
        let way = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        way.setAttribute("x", 4);
        way.setAttribute("y", 0);
        way.setAttribute("width", 2);
        if (dirs(card).up === "yes") {
            way.setAttribute("height", 8.5);
        } else {
            way.setAttribute("height", 2);
        }
        way.setAttribute("fill", "red");
        elem.appendChild(way);
    }

    if (dirs(card).down !== "no") {
        let way = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        way.setAttribute("x", 4);
        way.setAttribute("width", 2);
        if (dirs(card).down === "yes") {
            way.setAttribute("height", 8.5);
            way.setAttribute("y", 6.5);
        } else {
            way.setAttribute("height", 2);
            way.setAttribute("y", 13);
        }
        way.setAttribute("fill", "red");
        elem.appendChild(way);
    }

    if (dirs(card).left !== "no") {
        let way = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        way.setAttribute("x", 0);
        way.setAttribute("y", 6.5);
        way.setAttribute("height", 2);
        if (dirs(card).left === "yes") {
            way.setAttribute("width", 6);
        } else {
            way.setAttribute("width", 2);
        }
        way.setAttribute("fill", "red");
        elem.appendChild(way);
    }

    if (dirs(card).right !== "no") {
        let way = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        way.setAttribute("y", 6.5);
        way.setAttribute("height", 2);
        if (dirs(card).right === "yes") {
            way.setAttribute("width", 6);
            way.setAttribute("x", 4);
        } else {
            way.setAttribute("width", 2);
            way.setAttribute("x", 8);
        }
        way.setAttribute("fill", "red");
        elem.appendChild(way);
    }

    let cover = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    cover.setAttribute("fill", "black");
    cover.setAttribute("rx", 1);
    cover.setAttribute("width", 10);
    cover.setAttribute("height", 15);
    elem.appendChild(cover);


    let gt = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gt.appendChild(elem);

    let anim = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
    anim.setAttribute("attributeName", "transform");
    anim.setAttribute("attributeType", "XML");
    anim.setAttribute("type", "translate");
    anim.setAttribute("dur", "300ms");
    anim.setAttribute("begin", "0s");
    anim.setAttribute("repeatCount", "1");
    anim.setAttribute("fill", "freeze");
    gt.appendChild(anim);

    return [cover, gt, anim, elem];
}

function drawOurHand(we, offsetX, offsetY) {
    let x = offsetX;
    for (let card of we.hand) {
        if (card !== draggedCard) {
            drawCard(card, x, offsetY);
            createPickHandler(card);
            x += cardWidth;
        }
    }
}

function createPickHandler(card) {
    let pick = function(e) {
        if (finishMoveCallback !== null) {
            console.log(e);
            e.stopPropagation();
            draggedCard = card;
            drawCard(card, e.clientX - cardWidth / 2, e.clientY - cardWidth * 1.5 / 2, false, true);
            let drop = function(e) {
                let x = e.clientX - cardWidth / 2;
                let y = e.clientY - cardWidth * 1.5 / 2;

                let [a, b] = XYtoAB(x, y);
                let [canNotReversed, canReversed] = table.field.canBePlaced(draggedCard, a, b);
                if (canNotReversed || canReversed) {
                    if (canNotReversed && canReversed) {
                        // already in the correct orientation
                    } else if (canNotReversed) {
                        draggedCard = Math.abs(draggedCard);
                    } else if (canReversed) {
                        draggedCard = -Math.abs(draggedCard);
                    }
                    if (draggedCardFlipTimer !== null) {
                        clearInterval(draggedCardFlipTimer);
                    }
                    let move = new Move();
                    move.placeCard(draggedCard, a, b);
                    we.hand = we.hand.filter(item => item !== Math.abs(draggedCard));
                    draggedCard = null;
                    let callback = finishMoveCallback;
                    finishMoveCallback = null;
                    draw(table, we);
                    drawCache.cardData[Math.abs(card)].elem.onmousedown = null;
                    callback(move);
                } else {
                    draggedCard = null;
                    draw(table, we);
                }
            };

            drawCache.cardData[Math.abs(card)].elem[1].onmousedown = drop;
            drawCache.cardData[Math.abs(card)].elem[1].ontouchend = drop;
            drawCache.cardData[Math.abs(card)].elem[1].ontouchcancel = drop;
        }
    };

    drawCache.cardData[Math.abs(card)].elem[1].onmousedown = pick;
    drawCache.cardData[Math.abs(card)].elem[1].ontouchstart = pick;
}
