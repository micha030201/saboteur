"use strict"
/* global dirs Table Player Move shuffle cardIndices */

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
            if (this.table.field.canBePlaced(card, a, b)[0]) {
                card = Math.abs(card);
            } else {
                card = -Math.abs(card);
            }
            move.placeCard(card, a, b);
        }

        setTimeout(() => callback(move), 600);
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
        this.fieldCache = null;
        this.drawnCardsCache = {};

        this.svg = svg;
        window.addEventListener('resize', this.redraw.bind(this));

        this.redraw();
    }

    XYtoAB(x, y) {
        return [
            (x - this.zeroX) / this.cardWidth,
            (y - this.zeroY) / (this.cardWidth * 1.5)
        ];
    }

    ABtoXY(a, b) {
        return [
            this.zeroX + a * this.cardWidth,
            this.zeroY + b * this.cardWidth * 1.5
        ];
    }

    cardCacheEntry(card) {
        card = Math.abs(card);

        if (typeof this.drawnCardsCache[card] === "undefined") {
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

            this.drawnCardsCache[card] = {
                cover: cover,
                outerGroup: gt,
                animateTransform: anim,
                innerGroup: elem,

                a: 0,
                b: 0,
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

        if (
            c.a !== a
            || c.b !== b
            || c.hidden !== hidden
            || c.reversed !== reversed
            || c.width !== this.cardWidth
        ) {
            let [x, y] = this.ABtoXY(a, b);

            this.svg.appendChild(c.outerGroup);  // HACK

            c.cover.setAttribute("opacity", hidden ? 1 : 0);

            if (c.a === null || c.b === null || instant) {
                c.animateTransform.setAttribute("from", x + ", " + y);
            } else {
                if (!c.animateTransform.getAttribute("to")) {  // FIXME
                    throw new Error();
                }
                c.animateTransform.setAttribute("from", c.animateTransform.getAttribute("to"));
            }
            c.animateTransform.setAttribute("to", x + ", " + y);
            c.animateTransform.beginElement();

            c.innerGroup.setAttribute(
                "transform",
                "scale(" + this.cardWidth / 10 + ") "
                + "rotate(" + (reversed ? 180 : 0) + " " + (10 / 2) + " " + (10 * 1.5 / 2) + ")"
            );

            c.a = a;
            c.b = b;
            c.hidden = hidden;
            c.reversed = reversed;
            c.width = this.cardWidth;
        }
    }

    _drawOtherHand(player, a, b, instant) {
        // TODO draw allegiance
        for (let [i, card] of player.hand.entries()) {
            this.drawCard(card, a +  i * (2 / player.hand.length), b, true, instant);
        }
        // TODO draw breakage
    }

    drawOtherHands(instant) {
        for (let [i, player] of Object.entries(this.table.players.filter(p => p !== this.we))) {
            this._drawOtherHand(player, (i % 3) * 4 - 2, i > 3 ? -7 : -5, instant);
        }
    }

    drawDeck(instant) {
        // TODO some indication if there are no cards
        for (let card of this.table.deck) {
            this.drawCard(card, 10, -7, true, instant);
        }
    }

    drawDiscardPile(instant) {
        // TODO some indication if there are no cards
        for (let card of this.table.discardPile) {
            this.drawCard(card, 12, 2, instant);
        }
    }

    fieldCacheEntry() {
        if (this.fieldCache === null) {
            let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("fill", "gainsboro");
            rect.setAttribute("rx", 5);

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
        let [x, y] = this.ABtoXY(-2, -3);

        if (
            c.x !== x
            || c.y !== y
            || c.width !== this.cardWidth
        ) {
            this.svg.appendChild(c.elem);  // HACK

            c.elem.setAttribute("x", x);
            c.elem.setAttribute("y", y);

            c.elem.setAttribute("width", this.cardWidth * 13);
            c.elem.setAttribute("height", this.cardWidth * 1.5 * 7);

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

    drawOurHand(instant) {
        for (let [i, card] of this.we.hand.entries()) {
            this.drawCard(card, i - 2, 5, false, instant);
            this.createPickHandler(card);
        }
    }

    redraw() {
        if (this.table.won) {
            console.log("honest team won");
        } else if (this.table.lost) {
            console.log("saboteurs won");
        }

        this.svg.setAttribute("width", window.innerWidth);
        this.svg.setAttribute("height", window.innerHeight);
        this.svg.setAttribute("viewBox", "0 0 " + window.innerWidth + " " + window.innerHeight);

        if (window.innerHeight / 14 / 1.5 <= window.innerWidth / 14) {
            this.cardWidth = window.innerHeight / 14 / 1.5;
            this.zeroX = (window.innerWidth - this.cardWidth * 13) / 2 + this.cardWidth * 2;
            this.zeroY = this.cardWidth * 1.5 * 7.5;
        } else {
            this.cardWidth = window.innerWidth / 14;
            this.zeroX = this.cardWidth * 2.5;
            this.zeroY = (window.innerHeight - this.cardWidth * 1.5 * 13) / 2 + this.cardWidth * 7;
        }

        this.drawOtherHands(true);
        this.drawDeck(true);
        this.drawDiscardPile(true);
        this.drawField(true);
        this.drawOurHand(true);
    }

    drawMove(move) {
        if (move.type === "noop") {
            this.redraw();
        } else if (move.type === "place") {
            this.drawCard(move.card, move.a, move.b, false, false);
            setTimeout(() => this.drawOtherHands(false), 300);
        } else if (move.type === "discard") {
            this.drawCard(move.card, 10, -5);
            setTimeout(() => this.drawOtherHands(false), 300);
        }
        this.drawOurHand();
    }

    followEvent(e) {
        let x, y;
        if (typeof e.changedTouches !== "undefined") {
            x = e.changedTouches[0].clientX - this.cardWidth * 1.5;
            y = e.changedTouches[0].clientY - this.cardWidth * 1.5 - this.cardWidth / 2;
        } else {
            x = e.clientX - this.cardWidth / 2;
            y = e.clientY - this.cardWidth * 1.5 / 2;
        }
        return this.XYtoAB(x, y);
    }

    createPickHandler(card) {
        let elem = this.cardCacheEntry(card).outerGroup;

        let pick = function(e) {
            if (this.we.moveDone !== null) {
                e.stopPropagation();
                let [a, b] = this.followEvent(e);
                this.drawCard(card, a, b, false, true);

                let drag = function(e) {
                    let [a, b] = this.followEvent(e);

                    let [canNotReversed, canReversed] = this.table.field.canBePlaced(card, Math.round(a), Math.round(b));
                    if (canNotReversed || canReversed) {
                        a = Math.round(a);
                        b = Math.round(b);
                    }

                    this.drawCard(card, a, b, false, true);
                };

                let drop = function(e) {
                    let [a, b] = this.followEvent(e);
                    a = Math.round(a);
                    b = Math.round(b);

                    let [canNotReversed, canReversed] = this.table.field.canBePlaced(card, a, b);
                    if (canNotReversed || canReversed) {
                        if (canNotReversed && canReversed) {
                            // already in the correct orientation
                        } else if (canNotReversed) {
                            card = Math.abs(card);
                        } else if (canReversed) {
                            card = -Math.abs(card);
                        }

                        let move = new Move();
                        move.placeCard(card, a, b);

                        this.svg.onmousemove = null;
                        this.svg.ontouchmove = null;

                        elem.onmousedown = null;
                        elem.ontouchend = null;
                        elem.ontouchcancel = null;

                        this.we.moveDone(move);
                    } else {
                        this.svg.onmousemove = null;
                        this.svg.ontouchmove = null;

                        elem.onmousedown = null;
                        elem.ontouchend = null;
                        elem.ontouchcancel = null;

                        this.drawOurHand();
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
}

document.addEventListener('DOMContentLoaded', function() {
    let svg = document.getElementById("gamearea");

    let table = new Table();

    let we = new OurPlayer(table, "me", "honest");
    let bot = new BotPlayer(table, "connor", "saboteur");
    let bot2 = new BotPlayer(table, "dummy plug", "saboteur");

    table.players = [we, bot, bot2];
    table.deck = shuffle(cardIndices);
    table.finishCards = [1, 2, 3];

    let gui = new GUI(table, we, svg);

    table.startGame();
});
