"use strict"
/* global dirs Player Move shuffle symmetrical NetGame */

const ANIMATION_LENGTH = 600;  // in milliseconds

// has to correspond to assets/* image sizes
const TEXTURE_WIDTH = 10;
const TEXTURE_HEIGHT_RATIO = 1.5;// 538 / 380;

const TOTAL_CARDS_HORIZONTALLY = 18;
const TOTAL_CARDS_VERTICALLY = 21;

const ZERO_A = 4;
const ZERO_B = 10;

// coordinates below relative to zero

const DISCARD_PILE_A = 12;
const DISCARD_PILE_B = -8;

const DECK_A = 12;
const DECK_B = -10;

const OUR_HAND_A = -3;
const OUR_HAND_B = 8;

const OTHER_HANDS_A = -4;
const OTHER_HANDS_B = -10;

// has to corespond to the actual field limits
const FIELD_A = -4;
const FIELD_B = -6;
const FIELD_WIDTH = 17;
const FIELD_HEIGHT = 13;


class OurPlayer extends Player {
    constructor(...args) {
        super(...args);
        this.moveDone = null;
    }

    makeMove(callback) {
        console.log("player");
        this.moveDone = callback;
    }
}

class BotPlayer extends Player {
    makeMove(callback) {
        console.log(this.name);

        let move = new Move();
        let spaces = [], card;
        for (card of this.hand) {
            spaces = this.table.field.availableSpaces(card);
        }
        if (!spaces.length) {
            move.discard(card);
        } else {
            let [a, b] = spaces.randomElement();
            if (this.table.field.canBePlaced(card, a, b)) {
                card = Math.abs(card);
            } else {
                card = -Math.abs(card);
            }
            move.placeCard(card, a, b);
        }

        setTimeout(() => callback(move), 0);
    }
}

class GUI {
    constructor(table, we, svg) {
        table.moveCallback = this.drawMove.bind(this);
        this.table = table;
        this.we = we;

        this.cardWidth = 0;
        this.zeroX = 0;
        this.zeroY = 0;
        this.rotateIcons = null;
        this.availableSpaces = null;
        this.fieldCache = null;
        this.ourTurn = false;
        this.cardsHider = null;
        this.gameOverScreen = null;
        this.discardPile = null;
        this.playerNames = {};
        this.drawnCardsCache = {};

        this.touch = false;

        this.svg = svg;
        window.addEventListener('resize', this.redraw.bind(this));
    }

    XYtoAB(x, y) {
        return [
            (x - this.zeroX) / this.cardWidth,
            (y - this.zeroY) / (this.cardWidth * TEXTURE_HEIGHT_RATIO)
        ];
    }

    ABtoXY(a, b) {
        return [
            this.zeroX + a * this.cardWidth,
            this.zeroY + b * this.cardWidth * TEXTURE_HEIGHT_RATIO
        ];
    }

    cardCacheEntry(card) {
        card = Math.abs(card);

        if (typeof this.drawnCardsCache[card] === "undefined") {
            let elem = document.createElementNS("http://www.w3.org/2000/svg", "g");

            let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.a(
                "fill", "black",
                "rx", 1,
                "width", TEXTURE_WIDTH,
                "height", 15,
            );
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
            cover.setAttribute("width", TEXTURE_WIDTH);
            cover.setAttribute("height", 15);
            elem.appendChild(cover);


            let gt = document.createElementNS("http://www.w3.org/2000/svg", "g");
            gt.appendChild(elem);

            let anim = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
            anim.a(
                "attributeName", "transform",
                "attributeType", "XML",
                "type", "translate",
                "dur", `${ANIMATION_LENGTH}ms`,
                "begin", "0s",
                "repeatCount", "1",
                "fill", "freeze",
            );
            gt.appendChild(anim);

            this.drawnCardsCache[card] = {
                cover: cover,
                outerGroup: gt,
                animateTransform: anim,
                innerGroup: elem,

                x: 0,
                y: 0,
                width: 0,
                hidden: true,
                reversed: false,
            };
        }

        return this.drawnCardsCache[card];
    }

    drawCard(card, a, b, hidden, instant) {
        let reversed = card < 0;
        let c = this.cardCacheEntry(card);

        let [x, y] = this.ABtoXY(a, b);

        if (
            c.x !== x
            || c.y !== y
            || c.hidden !== hidden
            || c.reversed !== reversed
            || c.width !== this.cardWidth
        ) {
            this.svg.appendChild(c.outerGroup);  // HACK

            c.cover.a("opacity", hidden ? 1 : 0);

            if (c.a === null || c.b === null || instant) {
                c.animateTransform.a("from", `${x}, ${y}`);
            } else {
                if (!c.animateTransform.getAttribute("to")) {  // FIXME
                    throw new Error();
                }
                c.animateTransform.a("from", c.animateTransform.getAttribute("to"));
            }
            c.animateTransform.a("to", `${x}, ${y}`);
            c.animateTransform.beginElement();

            c.innerGroup.a(
                "transform",
                `scale(${this.cardWidth / TEXTURE_WIDTH})
                 rotate(${reversed ? 180 : 0} ${TEXTURE_WIDTH / 2} ${TEXTURE_WIDTH * TEXTURE_HEIGHT_RATIO / 2})`  // FIXME
            );

            c.x = x;
            c.y = y;
            c.hidden = hidden;
            c.reversed = reversed;
            c.width = this.cardWidth;
        }
    }

    _drawName(player, x, y) {
        let elem;
        if (typeof this.playerNames[player.name] === "undefined") {
            elem = document.createElementNS("http://www.w3.org/2000/svg", "text");
            this.svg.appendChild(elem);
            this.playerNames[player.name] = elem;
        } else {
            elem = this.playerNames[player.name];
        }
        elem.a(
            "x", x,
            "y", y,
            "style", `font: italic ${this.cardWidth / 3}px sans-serif;`,
        );
        elem.textContent = player.name;
    }

    _drawOtherHand(player, a, b, instant) {
        // TODO draw allegiance
        let [x, y] = this.ABtoXY(a, b);
        this._drawName(player, x, y - this.cardWidth / 5);
        for (let [i, card] of player.hand.entries()) {
            this.drawCard(card, a +  i * (2 / player.hand.length), b, true, instant);
        }
        // TODO draw breakage
    }

    drawOtherHands(instant) {
        for (let [i, player] of Object.entries(this.table.players.filter(p => p !== this.we))) {
            this._drawOtherHand(player, (i % 3) * 4 + OTHER_HANDS_A, OTHER_HANDS_B + (i > 4 ? 0 : 2), instant);
        }
    }

    drawDeck(instant) {
        // TODO some indication if there are no cards
        for (let card of this.table.deck) {
            this.drawCard(card, DECK_A, DECK_B, true, instant);
        }
    }

    drawDiscardPile(instant) {
        let elem = document.getElementById("discardPile");
        elem.a(
            "x", this.zeroX + this.cardWidth * DISCARD_PILE_A,
            "y", this.zeroY + this.cardWidth * TEXTURE_HEIGHT_RATIO * DISCARD_PILE_B,
            "width", this.cardWidth,
            "height", this.cardWidth * TEXTURE_HEIGHT_RATIO,
        );

        for (let card of this.table.discardPile) {
            this.drawCard(card, DISCARD_PILE_A, DISCARD_PILE_B, false, instant);
        }
    }

    fieldCacheEntry() {
        if (this.fieldCache === null) {
            let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.a(
                "fill", "gainsboro",
                "rx", 5,
            );

            this.svg.appendChild(rect);

            this.fieldCache = {
                elem: rect,
                x: 0,
                y: 0,
                width: 0,
            };
        }

        return this.fieldCache;
    }

    drawField(instant) {
        let c = this.fieldCacheEntry();
        let [x, y] = this.ABtoXY(FIELD_A, FIELD_B);

        if (
            c.x !== x
            || c.y !== y
            || c.width !== this.cardWidth
        ) {
            c.elem.a(
                "x", x,
                "y", y,

                "width", this.cardWidth * FIELD_WIDTH,
                "height", this.cardWidth * TEXTURE_HEIGHT_RATIO * FIELD_HEIGHT,
            );

            c.x = x;
            c.y = y;
            c.width = this.cardWidth;
        }

        if (this.table.finishCards[0] !== null) {
            this.drawCard(this.table.finishCards[0], 8, -2, true, instant);
        }
        if (this.table.finishCards[1] !== null) {
            this.drawCard(this.table.finishCards[1], 8, 0, true, instant);
        }
        if (this.table.finishCards[2] !== null) {
            this.drawCard(this.table.finishCards[2], 8, 2, true, instant);
        }

        for (let [a, b, card] of this.table.field.cards()) {
            this.drawCard(card, a, b, false, instant);
        }
    }

    _drawAvailableSpaces(card) {
        if (this.availableSpaces === null) {
            this.availableSpaces = {};
            for (let i = FIELD_A; i < FIELD_WIDTH + FIELD_A; ++i) {
                let column = {};
                for (let j = FIELD_B; j < FIELD_HEIGHT + FIELD_B; ++j) {
                    let elem = document.createElementNS("http://www.w3.org/2000/svg", "rect")
                    elem.a("fill", "green");
                    this.svg.appendChild(elem);
                    column[j] = elem;
                }
                this.availableSpaces[i] = column;
            }
        }
        for (let a = FIELD_A; a < FIELD_WIDTH + FIELD_A; ++a) {
            for (let b = FIELD_B; b < FIELD_HEIGHT + FIELD_B; ++b) {
                let elem = this.availableSpaces[a][b];
                let [x, y] = this.ABtoXY(a, b);
                elem.a(
                    "x", x,
                    "y", y,
                    "width", this.cardWidth,
                    "height", this.cardWidth * TEXTURE_HEIGHT_RATIO,
                    "opacity", card !== null && this.table.field.canBePlaced(card, a, b) ? 0.3 : 0,
                );
            }
        }
    }

    _drawRotateIcon(index, visible) {
        let elem;
        if (this.rotateIcons === null) {
            this.rotateIcons = [];
            for (let i = 0; i < 6; ++i) {
                elem = document.createElementNS("http://www.w3.org/2000/svg", "image");
                elem.setAttributeNS("http://www.w3.org/1999/xlink", "href", "assets/rotate.svg");
                this.createRotateHandler(elem, i);
                this.svg.appendChild(elem);
                this.rotateIcons[i] = elem;
            }
        } else {
            elem = this.rotateIcons[index];
        }
        elem.a(
            "x", this.zeroX + this.cardWidth * (OUR_HAND_A + index),
            "y", this.zeroY + this.cardWidth * TEXTURE_HEIGHT_RATIO * (OUR_HAND_B - 1),
            "width", this.cardWidth,
            "height", this.cardWidth * TEXTURE_HEIGHT_RATIO,
            "opacity", visible ? 1 : 0,
        );
    }

    _drawCardsHider(hide) {
        let elem;
        if (this.cardsHider === null) {
            elem = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            elem.a("fill", "white");  // FIXME
            this.cardsHider = elem;
        } else {
            elem = this.cardsHider;
        }
        this.svg.appendChild(elem);  // HACK
        elem.a(
            "x", this.zeroX + this.cardWidth * OUR_HAND_A,
            "y", hide ? this.zeroY + this.cardWidth * TEXTURE_HEIGHT_RATIO * OUR_HAND_B : -9999,
            "width", this.cardWidth * this.we.hand.length,
            "height", this.cardWidth * TEXTURE_HEIGHT_RATIO,
            "opacity", 0.5,
        );
    }

    drawOurHand(instant) {
        let [x, y] = this.ABtoXY(OUR_HAND_A, OUR_HAND_B + 1 + 1/3);  // FIXME
        this._drawName(this.we, x, y);
        for (let i = 0; i < 6; ++i) {
            let card = this.we.hand[i];
            if (typeof card === "undefined") {
                this._drawRotateIcon(i, false);
                continue;
            }

            let canBePlacedAsIs = this.table.field.availableSpaces(card).length;
            let canBePlacedReversed = this.table.field.availableSpaces(-card).length;

            this._drawRotateIcon(i, this.ourTurn && canBePlacedAsIs && canBePlacedReversed && !symmetrical(card));

            if (this.ourTurn && canBePlacedReversed && !canBePlacedAsIs) {
                this.we.hand[i] = card = -card;
            }
            this.drawCard(card, i + OUR_HAND_A, OUR_HAND_B, false, instant);
            this.createPickHandler(card);
        }
        this._drawCardsHider(!this.ourTurn);
    }

    drawGameOver(won) {
        // FIXME
        let elem;
        if (this.gameOverScreen === null) {
            elem = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            this.gameOverScreen = elem;
        } else {
            elem = this.gameOverScreen;
        }
        this.svg.appendChild(elem);  // HACK
        elem.a(
            "x", -500,
            "y", -500,
            "width", 99999,
            "height", 99999,
            "fill", won ? "green" : "red",
        );
    }

    redraw() {
        if (this.table.won || this.table.lost) {
            this.drawGameOver(this.table.won);
        }

        this.svg.a(
            "width", window.innerWidth,
            "height", window.innerHeight,
            "viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`,
        );

        if (window.innerHeight / TOTAL_CARDS_VERTICALLY / TEXTURE_HEIGHT_RATIO <= window.innerWidth / TOTAL_CARDS_HORIZONTALLY) {
            this.cardWidth = window.innerHeight / TOTAL_CARDS_VERTICALLY / TEXTURE_HEIGHT_RATIO;
            this.zeroX = (window.innerWidth - this.cardWidth * (TOTAL_CARDS_HORIZONTALLY - 1)) / 2 + this.cardWidth * ZERO_A;
            this.zeroY = this.cardWidth * TEXTURE_HEIGHT_RATIO * (ZERO_B + 0.5);
        } else {
            this.cardWidth = window.innerWidth / TOTAL_CARDS_HORIZONTALLY;
            this.zeroX = this.cardWidth * (ZERO_A + 0.5);
            this.zeroY = (window.innerHeight - this.cardWidth * TEXTURE_HEIGHT_RATIO * (TOTAL_CARDS_VERTICALLY - 1)) / 2 + this.cardWidth * TEXTURE_HEIGHT_RATIO * ZERO_B;
        }

        this.drawOtherHands(true);
        this.drawDeck(true);
        this.drawDiscardPile(true);
        this.drawField(true);
        this.drawOurHand(true);
    }

    drawMove(move, player, callback) {
        if (this.table.won || this.table.lost) {
            setTimeout(() => this.drawGameOver(this.table.won), ANIMATION_LENGTH * 2);
        }
        // move cards manually so that they stay on top
        if (move.type === "noop") {
            this.redraw();
        } else if (move.type === "place") {
            this.drawCard(move.card, move.a, move.b, false, false);
            setTimeout(() => this.drawOtherHands(false), ANIMATION_LENGTH);
            setTimeout(() => this.drawField(true), ANIMATION_LENGTH * (this.ourTurn ? 0 : 1));  // HACK
        } else if (move.type === "discard") {
            this.drawCard(move.card, DISCARD_PILE_A, DISCARD_PILE_B);
            setTimeout(() => this.drawOtherHands(false), ANIMATION_LENGTH);
        }

        this.ourTurn = this.table.nextPlayer(player) === this.we;
        setTimeout(() => this.drawOurHand(false), ANIMATION_LENGTH * (this.ourTurn ? 2 : 0));

        setTimeout(callback, ANIMATION_LENGTH * ((player === this.we) ? 1 : 2));
    }

    followEvent(e) {
        let x, y;
        if (typeof e.changedTouches !== "undefined") {
            x = e.changedTouches[0].clientX - this.cardWidth;
            y = e.changedTouches[0].clientY - this.cardWidth * TEXTURE_HEIGHT_RATIO;
        } else {
            x = e.clientX - this.cardWidth / 2;
            y = e.clientY - this.cardWidth * TEXTURE_HEIGHT_RATIO / 2;
        }
        return this.XYtoAB(x, y);
    }

    correctEventType(e) {
        if (typeof e.changedTouches !== "undefined") {
            this.touch = true;  // i'm using tilt controls
            return true;
        }
        return !this.touch;
    }

    createPickHandler(card) {
        let elem = this.cardCacheEntry(card).outerGroup;

        let pick = function(e) {
            if (this.we.moveDone !== null) {
                if (!this.correctEventType(e)) {
                    return;
                }
                e.stopPropagation();

                let [a, b] = this.followEvent(e);
                this._drawAvailableSpaces(card);
                this._drawRotateIcon(this.we.hand.indexOf(card), false);  // FIXME
                this.drawCard(card, a, b, false, true);

                let drag = function(e) {
                    if (!this.correctEventType(e)) {
                        return;
                    }

                    let [a, b] = this.followEvent(e);

                    if (this.table.field.canBePlaced(card, Math.round(a), Math.round(b))) {
                        a = Math.round(a);
                        b = Math.round(b);
                    }

                    this.drawCard(card, a, b, false, true);
                };

                let drop = function(e) {
                    if (!this.correctEventType(e)) {
                        return;
                    }

                    this.svg.onmousemove = null;
                    this.svg.ontouchmove = null;

                    elem.onmousedown = null;
                    elem.ontouchend = null;
                    elem.ontouchcancel = null;

                    this._drawAvailableSpaces(null);

                    let [a, b] = this.followEvent(e);
                    a = Math.round(a);
                    b = Math.round(b);

                    if (a === DISCARD_PILE_A && b === DISCARD_PILE_B) {
                        this.drawCard(card, a, b, false, true);

                        let move = new Move();
                        move.discard(card);
                        this.we.moveDone(move);
                    }

                    if (this.table.field.canBePlaced(card, a, b)) {
                        let move = new Move();
                        move.placeCard(card, a, b);
                        this.we.moveDone(move);
                    } else {
                        this.drawOurHand(false);
                    }
                };

                this.svg.onmousemove = drag.bind(this);
                this.svg.ontouchmove = drag.bind(this);

                elem.onmousedown = drop.bind(this);
                elem.ontouchend = drop.bind(this);
                elem.ontouchcancel = drop.bind(this);
            }
        };

        elem.onmousedown = pick.bind(this);
        elem.ontouchstart = pick.bind(this);
    }

    createRotateHandler(elem, index) {
        let rotate = function(e) {
            if (!this.correctEventType(e)) {
                return;
            }
            e.stopPropagation();

            let canBePlacedAsIs = this.table.field.availableSpaces(this.we.hand[index]).length;
            let canBePlacedReversed = this.table.field.availableSpaces(-this.we.hand[index]).length;

            if (this.ourTurn && canBePlacedAsIs && canBePlacedReversed && !symmetrical(this.we.hand[index])) {
                this.we.hand[index] = -this.we.hand[index];
                this.drawOurHand(true);
            }
        };

        elem.onmousedown = rotate.bind(this);
        elem.ontouchstart = rotate.bind(this);
    }
}

window.addEventListener("load", function() {
    let svg = document.getElementById("gamearea");

    let netgame = new NetGame();

    netgame.createGame();

    netgame.onPlayerAdd = console.log;

    let names = shuffle(["Shinji", "Rei", "Asuka"]);

    let we = new OurPlayer(netgame.table, names.pop(), "honest");
    let bot = new BotPlayer(netgame.table, names.pop(), "saboteur");
    let bot2 = new BotPlayer(netgame.table, names.pop(), "saboteur");

    let gui = new GUI(netgame.table, we, svg);

    netgame.addPlayer(we);
    netgame.addPlayer(bot);
    netgame.addPlayer(bot2);

    netgame.startGame(function(table) {
        gui.redraw();

        table.startGame();
    });
});
