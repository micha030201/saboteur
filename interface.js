"use strict"
/* global finishCardIndex finishCardAB type impairmentType DefaultDict Player Move shuffle symmetrical NetGame roleOffsets sprite cover */

const ANIMATION_LENGTH = 600;  // in milliseconds

// has to correspond to assets/* image sizes
const SPRITE_WIDTH = 10;
const SPRITE_HEIGHT_RATIO = 538 / 380;

const TOTAL_CARDS_HORIZONTALLY = 18;
const TOTAL_CARDS_VERTICALLY = 21;

const ZERO_A = 4;
const ZERO_B = 11;

// coordinates below relative to zero

const BACKGROUND_A = -4.5;
const BACKGROUND_B = -11.5;

const LEAVE_A = 12;
const LEAVE_B = -11;

const DISCARD_PILE_A = 12;
const DISCARD_PILE_B = -8;

const DECK_A = 12;
const DECK_B = -10;

const OUR_HAND_A = -3;
const OUR_HAND_B = 8;

const OUR_HAND_CARDS_OFFSET_A = 2;
const OUR_HAND_IMPAIR_OFFSET_A = 9;

const OTHER_HANDS_A = -4;
const OTHER_HANDS_B = -10;

// has to corespond to the actual field limits
const FIELD_A = -4;
const FIELD_B = -6;
const FIELD_WIDTH = 17;
const FIELD_HEIGHT = 13;


class OurPlayer extends Player {
    constructor(netgame, ...args) {
        super(...args);

        this.netgame = netgame;
        this._moveDone = null;
    }

    moveDone(move) {
        this.netgame.sendMove(this, move);
        this._moveDone(move);
    }

    makeMove(callback) {
        console.log(this.name);
        this._moveDone = callback;
    }
}

class BotPlayer extends Player {
    constructor(netgame, ...args) {
        super(...args);

        this.netgame = netgame;
    }

    makeMove(callback) {
        console.log(this.name);

        let move = new Move();
        move.discard(this.hand[0]);
        //let spaces = [], card;
        //for (card of this.hand) {
        //    spaces = this.table.field.availableSpaces(card);
        //}
        //if (!spaces.length) {
        //    move.discard(card);
        //} else {
        //    let [a, b] = spaces.randomElement();
        //    if (this.table.field.canBePlaced(card, a, b)) {
        //        card = Math.abs(card);
        //    } else {
        //        card = -Math.abs(card);
        //    }
        //    move.placeCard(card, a, b);
        //}

        this.netgame.sendMove(this, move);
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
        this.background = null;

        this.touch = false;

        this.svg = svg;
        window.addEventListener('resize', this.redraw.bind(this));
    }

    XYtoAB(x, y) {
        return [
            (x - this.zeroX) / this.cardWidth,
            (y - this.zeroY) / (this.cardWidth * SPRITE_HEIGHT_RATIO)
        ];
    }

    ABtoXY(a, b) {
        return [
            this.zeroX + a * this.cardWidth,
            this.zeroY + b * this.cardWidth * SPRITE_HEIGHT_RATIO
        ];
    }

    get otherPlayers() {
        return this.table.players.filter(p => p !== this.we);
    }

    cardCacheEntry(card) {
        card = Math.abs(card);

        if (typeof this.drawnCardsCache[card] === "undefined") {
            let elem = document.createElementNS("http://www.w3.org/2000/svg", "g");

            let image = document.createElementNS("http://www.w3.org/2000/svg", "image");
            image.setAttributeNS("http://www.w3.org/1999/xlink", "href", `assets/sprites/${sprite(card)}.jpg`);
            image.a(
                "clip-path", "url(#spriteClip)",
                "width", SPRITE_WIDTH,
                "height", SPRITE_WIDTH * SPRITE_HEIGHT_RATIO,
            );
            elem.appendChild(image);

            let back = document.createElementNS("http://www.w3.org/2000/svg", "image");
            back.setAttributeNS("http://www.w3.org/1999/xlink", "href", `assets/sprites/${cover(card)}.jpg`);
            back.a(
                "clip-path", "url(#spriteClip)",
                "width", SPRITE_WIDTH,
                "height", SPRITE_WIDTH * SPRITE_HEIGHT_RATIO,
            );
            elem.appendChild(back);


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
                cover: back,
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

        this.svg.appendChild(c.outerGroup);
        if (
            c.x !== x
            || c.y !== y
            || c.hidden !== hidden
            || c.reversed !== reversed
            || c.width !== this.cardWidth
        ) {
            c.cover.a("opacity", hidden ? 1 : 0);

            if (c.a === null || c.b === null || instant) {
                c.animateTransform.a("from", `${x}, ${y}`);
            } else {
                if (!c.animateTransform.getAttribute("to")) {
                    throw new Error("cannot move card that doesn't exist");
                }
                c.animateTransform.a("from", c.animateTransform.getAttribute("to"));
            }
            c.animateTransform.a("to", `${x}, ${y}`);
            c.animateTransform.beginElement();

            c.innerGroup.a(
                "transform",
                `scale(${this.cardWidth / SPRITE_WIDTH})
                 rotate(${reversed ? 180 : 0} ${SPRITE_WIDTH / 2} ${SPRITE_WIDTH * SPRITE_HEIGHT_RATIO / 2})`
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
            "style", `font: italic ${this.cardWidth / 3}px sans-serif; fill: white;`,
        );
        if (player === this.we || this.table.gameOver) {
            elem.textContent = `${player.name} (${player.role})`;
        } else {
            elem.textContent = player.name;
        }
    }

    _whereDrawOtherHand(player) {
        let index = this.otherPlayers.indexOf(player);
        return [OTHER_HANDS_A + (index % 4) * 4, OTHER_HANDS_B + (index > 5 ? 0 : 2)];
    }

    _whoseHandThere(a, b) {
        if (a === OUR_HAND_A && b === OUR_HAND_B) {
            return this.we;
        }
        for (let player of this.otherPlayers) {
            let [a_, b_] = this._whereDrawOtherHand(player);
            if (a === a_ && b === b_) {
                return player;
            }
        }
    }

    impairCardAB(player, index) {
        if (player === this.we) {
            return [OUR_HAND_A + OUR_HAND_IMPAIR_OFFSET_A + index, OUR_HAND_B];
        }
        let [a, b] = this._whereDrawOtherHand(player);
        return [a + 0.5 + index, b];
    }

    drawOtherHand(player, instant) {
        let [a, b] = this._whereDrawOtherHand(player);
        let [x, y] = this.ABtoXY(a, b);
        this._drawName(player, x, y - this.cardWidth / 5 - this.cardWidth * SPRITE_HEIGHT_RATIO / 2);
        for (let [i, card] of player.hand.entries()) {
            this.drawCard(card, a + 0.5 + i * (2 / player.hand.length), b - 0.5, true, instant);
        }
        for (let [i, card] of player.impairments.entries()) {
            if (card !== null) {
                let [a, b] = this.impairCardAB(player, i);
                this.drawCard(card, a, b, false, instant);
            }
        }
        this.drawCard(roleOffsets[player.role] + player.id, a, b, !this.table.gameOver, instant);
    }

    drawOtherHands(instant) {
        for (let player of this.otherPlayers) {
            this.drawOtherHand(player, instant);
        }
    }

    drawDeck(instant) {
        for (let card of this.table.deck) {
            this.drawCard(card, DECK_A, DECK_B, true, instant);
        }
    }

    drawDiscardPile(instant) {
        let elem = document.getElementById("discardPile");
        elem.a(
            "x", this.zeroX + this.cardWidth * DISCARD_PILE_A,
            "y", this.zeroY + this.cardWidth * SPRITE_HEIGHT_RATIO * DISCARD_PILE_B,
            "width", this.cardWidth,
            "height", this.cardWidth * SPRITE_HEIGHT_RATIO,
        );

        for (let card of this.table.discardPile) {
            this.drawCard(card, DISCARD_PILE_A, DISCARD_PILE_B, false, instant);
        }
    }

    fieldCacheEntry() {
        if (this.fieldCache === null) {
            let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.a(
                "fill", "#cea241",
                "opacity", 0.8,
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
                "height", this.cardWidth * SPRITE_HEIGHT_RATIO * FIELD_HEIGHT,
            );

            c.x = x;
            c.y = y;
            c.width = this.cardWidth;
        }

        for (let [index, [a, b]] of finishCardAB.entries()) {
            if (this.table.finishCards[index] !== null) {
                this.drawCard(this.table.finishCards[index], a, b, !this.we.seenFinishCards[index], instant);
            }
        }

        for (let [a, b, card] of this.table.field.cards()) {
            this.drawCard(card, a, b, false, instant);
        }
    }

    _canBePlaced(card, a, b) {
        if (card === null) {
            return false;
        }
        let playerThere = this._whoseHandThere(a, b);
        return (
            (a === DISCARD_PILE_A && b === DISCARD_PILE_B)
            || (type(card) === "destroy" && this.table.field.canBeRemoved(a, b))
            || (type(card) === "map" && typeof finishCardIndex[a][b] !== "undefined" && !this.we.seenFinishCards[finishCardIndex[a][b]])
            || (type(card) === "impair" && typeof playerThere !== "undefined" && playerThere !== this.we && playerThere.impairments[impairmentType(card)] === null)
            || (type(card) === "repair" && typeof playerThere !== "undefined" && playerThere.impairments[impairmentType(card)] !== null)
            || (type(card) === "path" && !this.we.impairments.any() && this.table.field.canBePlaced(card, a, b))
        );
    }

    _place(card, a, b) {
        let move = new Move();

        let playerThere = this._whoseHandThere(a, b);
        if (a === DISCARD_PILE_A && b === DISCARD_PILE_B) {
            move.discard(card);
        } else if (type(card) === "destroy" && this.table.field.canBeRemoved(a, b)) {
            move.destroy(card, a, b);
        } else if (type(card) === "map" && typeof finishCardIndex[a][b] !== "undefined" && !this.we.seenFinishCards[finishCardIndex[a][b]]) {
            move.look(card, finishCardIndex[a][b]);
        } else if (type(card) === "impair" && typeof playerThere !== "undefined" && playerThere !== this.we && playerThere.impairments[impairmentType(card)] === null) {
            move.impair(card, playerThere);
        } else if (type(card) === "repair" && typeof playerThere !== "undefined" && playerThere.impairments[impairmentType(card)] !== null) {
            move.repair(card, playerThere);
        } else if (type(card) === "path" && this.table.field.canBePlaced(card, a, b)) {
            move.placeCard(card, a, b);
        }

        setTimeout(() => this.we.moveDone(move));
    }

    _drawAvailableSpaces(card) {
        if (this.availableSpaces === null) {
            let possibleAvailableSpaces = [];
            for (let i = FIELD_A; i < FIELD_WIDTH + FIELD_A; ++i) {
                for (let j = FIELD_B; j < FIELD_HEIGHT + FIELD_B; ++j) {
                    possibleAvailableSpaces.push([i, j]);
                }
            }
            for (let player of this.otherPlayers) {
                possibleAvailableSpaces.push(this._whereDrawOtherHand(player));
            }
            possibleAvailableSpaces.push([OUR_HAND_A, OUR_HAND_B]);
            possibleAvailableSpaces.push([DISCARD_PILE_A, DISCARD_PILE_B]);

            this.availableSpaces = new DefaultDict(function () { return {}; });
            for (let [a, b] of possibleAvailableSpaces) {
                let elem = document.createElementNS("http://www.w3.org/2000/svg", "rect")
                elem.a("fill", "green");
                this.availableSpaces[a][b] = elem;
            }
        }

        for (let [a, column] of Object.entries(this.availableSpaces)) {
            for (let [b, elem] of Object.entries(column)) {
                a = a * 1;
                b = b * 1;

                let [x, y] = this.ABtoXY(a, b);
                elem.a(
                    "x", x,
                    "y", y,
                    "width", this.cardWidth,
                    "height", this.cardWidth * SPRITE_HEIGHT_RATIO,
                    "opacity", this._canBePlaced(card, a, b) ? 0.6 : 0,
                );
                this.svg.appendChild(elem);
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
            "x", this.zeroX + this.cardWidth * (OUR_HAND_A + OUR_HAND_CARDS_OFFSET_A + index),
            "y", this.zeroY + this.cardWidth * SPRITE_HEIGHT_RATIO * (OUR_HAND_B - 1),
            "width", this.cardWidth,
            "height", this.cardWidth * SPRITE_HEIGHT_RATIO,
            "opacity", visible ? 1 : 0,
        );
    }

    _drawCardsHider(hide) {
        let elem;
        if (this.cardsHider === null) {
            elem = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            elem.a("fill", "white");
            this.cardsHider = elem;
        } else {
            elem = this.cardsHider;
        }
        this.svg.appendChild(elem);
        elem.a(
            "x", this.zeroX + this.cardWidth * (OUR_HAND_A + OUR_HAND_CARDS_OFFSET_A),
            "y", hide ? this.zeroY + this.cardWidth * SPRITE_HEIGHT_RATIO * OUR_HAND_B : -9999,
            "width", this.cardWidth * this.we.hand.length,
            "height", this.cardWidth * SPRITE_HEIGHT_RATIO,
            "opacity", 0.5,
        );
    }

    drawOurHand(instant) {
        let [x, y] = this.ABtoXY(OUR_HAND_A, OUR_HAND_B + 1 + 1/3);
        this._drawName(this.we, x, y);
        this.drawCard(roleOffsets[this.we.role] + this.we.id, OUR_HAND_A, OUR_HAND_B, false, instant);
        for (let i = 0; i < 6; ++i) {
            let card = this.we.hand[i];
            if (typeof card === "undefined") {
                this._drawRotateIcon(i, false);
                continue;
            }
            if (type(card) === "path") {
                let canBePlacedAsIs = this.table.field.availableSpaces(card).length;
                let canBePlacedReversed = this.table.field.availableSpaces(-card).length;

                this._drawRotateIcon(i, this.ourTurn && canBePlacedAsIs && canBePlacedReversed && !symmetrical(card));

                if (this.ourTurn && canBePlacedReversed && !canBePlacedAsIs) {
                    this.we.hand[i] = card = -card;
                }
            } else {
                this._drawRotateIcon(i, false);
            }
            this.drawCard(card, OUR_HAND_A + OUR_HAND_CARDS_OFFSET_A + i, OUR_HAND_B, false, instant);
            this.createPickHandler(card);
        }
        for (let [i, card] of this.we.impairments.entries()) {
            if (card !== null) {
                let [a, b] = this.impairCardAB(this.we, i);
                this.drawCard(card, a, b, false, instant);
            }
        }
        this._drawCardsHider(!this.ourTurn);
    }

    drawHand(player, instant) {
        if (player === this.we) {
            this.drawOurHand(instant);
        } else {
            this.drawOtherHand(player, instant);
        }
    }

    redraw() {
        this.svg.a(
            "width", window.innerWidth,
            "height", window.innerHeight,
            "viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`,
        );

        if (window.innerHeight / TOTAL_CARDS_VERTICALLY / SPRITE_HEIGHT_RATIO <= window.innerWidth / TOTAL_CARDS_HORIZONTALLY) {
            this.cardWidth = window.innerHeight / TOTAL_CARDS_VERTICALLY / SPRITE_HEIGHT_RATIO;
            this.zeroX = (window.innerWidth - this.cardWidth * (TOTAL_CARDS_HORIZONTALLY - 1)) / 2 + this.cardWidth * ZERO_A;
            this.zeroY = this.cardWidth * SPRITE_HEIGHT_RATIO * (ZERO_B + 0.5);
        } else {
            this.cardWidth = window.innerWidth / TOTAL_CARDS_HORIZONTALLY;
            this.zeroX = this.cardWidth * (ZERO_A + 0.5);
            this.zeroY = (window.innerHeight - this.cardWidth * SPRITE_HEIGHT_RATIO * (TOTAL_CARDS_VERTICALLY - 1)) / 2 + this.cardWidth * SPRITE_HEIGHT_RATIO * ZERO_B;
        }

        if (this.background === null) {
            this.background = document.createElementNS("http://www.w3.org/2000/svg", "rect")
            this.background.a(
                "fill", "gainsboro",
                "opacity", 0.2,
            );
            this.svg.appendChild(this.background);
        }
        this.background.a(
            "x", this.zeroX + BACKGROUND_A * this.cardWidth,
            "y", this.zeroY + BACKGROUND_B * this.cardWidth * SPRITE_HEIGHT_RATIO,
            "width", TOTAL_CARDS_HORIZONTALLY * this.cardWidth,
            "height", TOTAL_CARDS_VERTICALLY * this.cardWidth * SPRITE_HEIGHT_RATIO,
        );

        let leave = document.getElementById("leave");
        leave.a(
            "x", this.zeroX + this.cardWidth * LEAVE_A,
            "y", this.zeroY + this.cardWidth * SPRITE_HEIGHT_RATIO * LEAVE_B,
            "width", this.cardWidth,
            "height", this.cardWidth * SPRITE_HEIGHT_RATIO,
        );
        leave.onclick = () => {
            window.location.hash = "";
            window.location.reload(true);
        };
        this.svg.appendChild(leave);

        this.drawOtherHands(true);
        this.drawDeck(true);
        this.drawDiscardPile(true);
        this.drawField(true);
        this.drawOurHand(true);
    }

    drawMove(move, player, callback) {
        if (this.table.gameOver) {
            setTimeout(() => this.redraw(), ANIMATION_LENGTH * 2);
            setTimeout(callback, ANIMATION_LENGTH * 2);
            return;
        }

        let moveAnimations = 0;
        if (player.name !== this.we.name) {
            // move cards manually so that they stay on top
            if (move.type === "noop") {
                this.redraw();
            } else if (move.type === "place") {
                this.drawCard(move.card, move.a, move.b, false, false);
                setTimeout(() => this.drawField(false), ANIMATION_LENGTH);
                setTimeout(() => this.drawOtherHands(false), ANIMATION_LENGTH);

                moveAnimations += 2;
            } else if (move.type === "discard") {
                this.drawCard(move.card, DISCARD_PILE_A, DISCARD_PILE_B);
                setTimeout(() => this.drawOtherHands(false), ANIMATION_LENGTH);

                moveAnimations += 2;
            } else if (move.type === "destroy") {
                this.drawCard(move.card, move.a, move.b);
                setTimeout(() => this.drawCard(move.card, DISCARD_PILE_A, DISCARD_PILE_B), ANIMATION_LENGTH * 2);
                setTimeout(() => this.drawDiscardPile(false), ANIMATION_LENGTH * 2);
                setTimeout(() => this.drawOtherHands(false), ANIMATION_LENGTH * 3);

                moveAnimations += 4;
            } else if (move.type === "look") {
                this.drawCard(move.card, ...finishCardAB[move.index]);
                setTimeout(() => this.drawCard(move.card, DISCARD_PILE_A, DISCARD_PILE_B), ANIMATION_LENGTH * 2);
                setTimeout(() => this.drawOtherHands(false), ANIMATION_LENGTH * 3);

                moveAnimations += 4;
            } else if (move.type === "impair") {
                this.drawHand(this.table.players[move.playerId], false);
                setTimeout(() => this.drawOtherHands(false), ANIMATION_LENGTH);

                moveAnimations += 2;
            } else if (move.type === "repair") {
                this.drawCard(move.card, ...this.impairCardAB(this.table.players[move.playerId], impairmentType(move.card)));
                setTimeout(() => this.drawDiscardPile(false), ANIMATION_LENGTH * 2);
                setTimeout(() => this.drawOtherHands(false), ANIMATION_LENGTH * 3);

                moveAnimations += 5;
            }
        } else {
            if (move.type === "noop") {
                this.redraw();
            } else if (move.type === "place") {
                this.drawField(false);
                setTimeout(() => this.drawOurHand(false), ANIMATION_LENGTH);

                moveAnimations += 1;
            } else if (move.type === "discard") {
                setTimeout(() => this.drawOurHand(false), ANIMATION_LENGTH);

                moveAnimations += 1;
            } else if (move.type === "destroy") {
                this.drawDiscardPile(false);
                setTimeout(() => this.drawOurHand(false), ANIMATION_LENGTH);

                moveAnimations += 2;
            } else if (move.type === "look") {
                this.drawDiscardPile(false);
                this.drawField(true);
                setTimeout(() => this.drawOurHand(false), ANIMATION_LENGTH);

                moveAnimations += 2;
            } else if (move.type === "impair") {
                this.drawHand(this.table.players[move.playerId], false);
                setTimeout(() => this.drawOtherHands(false), ANIMATION_LENGTH);

                moveAnimations += 2;
            } else if (move.type === "repair") {
                this.drawDiscardPile(false);
                setTimeout(() => this.drawOurHand(false), ANIMATION_LENGTH);

                moveAnimations += 2;
            }
        }

        setTimeout(callback, ANIMATION_LENGTH * moveAnimations);

        this.ourTurn = !this.table.gameOver && this.table.nextPlayer(player).name === this.we.name;
        setTimeout(() => this.drawOurHand(true), ANIMATION_LENGTH * moveAnimations);
    }

    followEvent(e) {
        let x, y;
        if (typeof e.changedTouches !== "undefined") {
            x = e.changedTouches[0].clientX - this.cardWidth;
            y = e.changedTouches[0].clientY - this.cardWidth * SPRITE_HEIGHT_RATIO;
        } else {
            x = e.clientX - this.cardWidth / 2;
            y = e.clientY - this.cardWidth * SPRITE_HEIGHT_RATIO / 2;
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
                this._drawRotateIcon(this.we.hand.indexOf(card), false);
                this.drawCard(card, a, b, false, true);

                let drag = function(e) {
                    if (!this.correctEventType(e)) {
                        return;
                    }

                    let [a, b] = this.followEvent(e);

                    if (this._canBePlaced(card, Math.round(a), Math.round(b))) {
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

                    if (this._canBePlaced(card, a, b)) {
                        this._place(card, a, b);
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
    let randomBotName = () => {
        return shuffle(["Shinji", "Rei", "Asuka"])[0];
    };

    let screens = {};
    for (let screenElem of document.querySelectorAll("template")) {
        screens[screenElem.id] = document.importNode(screenElem.content, true);
    }

    let playerNames = [];
    let switchScreens = function(newScreen) {
        while (document.body.lastChild) {
            document.body.removeChild(document.body.lastChild);
        }
        document.body.appendChild(screens[newScreen].cloneNode(true));
        if (newScreen !== "gameStarted") {
            for (let playerName of playerNames) {
                let elem = document.createElement("div");
                elem.a("class", "playerName");
                elem.textContent = playerName;
                document.body.appendChild(elem);
            }
        }
    };

    let netgame = new NetGame();

    let we = null;

    netgame.onGameStart = function(table, player) {
        if (we === null || !table.players.includes(we)) {
            switchScreens("joinFail");
        } else {
            switchScreens("gameStarted");
            let svg = document.getElementById("gamearea");

            let gui = new GUI(netgame.table, we, svg);
            gui.redraw();

            table.resumeGame(player);
        }
    };

    netgame.onPlayerAdd = function(playerName) {
        playerNames.push(playerName);
        let elem = document.createElement("div");
        elem.a("class", "playerName");
        elem.textContent = playerName;
        document.body.appendChild(elem);
    };

    let proceedWithGameCreation = () => {
        window.location.hash = `#${netgame.roomCode}`;
        switchScreens("gameSelected");

        document.getElementById("joinGame").onclick = () => {
            let name = document.getElementById("nameInput").value;
            if (name.length === 0) {
                return;
            }
            switchScreens("loading");
            we = new OurPlayer(netgame, netgame.table, name);
            netgame.addPlayer(we, (success) => {
                if (!success) {
                    switchScreens("joinFail");
                } else {
                    switchScreens("gameJoinedControls");

                    window.location.hash = `#${netgame.roomCode}/${we.name}`;

                    document.getElementById("addBot").onclick = () => {
                        let bot = new BotPlayer(netgame, netgame.table, randomBotName());
                        window.location.hash += "+" + bot.name;
                        netgame.addPlayer(bot, () => {});
                    };
                    document.getElementById("startGame").onclick = () => netgame.startGame();
                }
            });
        };
    };

    let selectGame = () => {
        switchScreens("gameSelected");

        document.getElementById("joinGame").onclick = () => {
            let name = document.getElementById("nameInput").value;
            if (name.length === 0) {
                return;
            }
            switchScreens("loading");
            we = new OurPlayer(netgame, netgame.table, name);
            netgame.addPlayer(we, (success) => {
                if (!success) {
                    switchScreens("joinFail");
                } else {
                    switchScreens("gameJoinedControls");

                    document.getElementById("addBot").onclick = () => {
                        let bot = new BotPlayer(netgame, netgame.table, randomBotName());
                        window.location.hash += "+" + bot.name;
                        netgame.addPlayer(bot, () => {});
                    };
                    document.getElementById("startGame").onclick = () => netgame.startGame();
                }
            });
        };
    };

    let joinGame = () => {
        switchScreens("gameJoinedControls");

        document.getElementById("addBot").onclick = () => {
            let bot = new BotPlayer(netgame, netgame.table, randomBotName());
            window.location.hash += "+" + bot.name;
            netgame.addPlayer(bot, () => {});
        };
        document.getElementById("startGame").onclick = () => netgame.startGame();
    };

    if (window.location.hash) {
        let match = window.location.hash.match(/#([A-Za-z0-9_-]*)(?:\/([^+]*))?(?:\+(.*))?/);
        if (typeof match[1] !== "undefined") {
            if (typeof match[2] !== "undefined") {
                let name = match[2];
                we = new OurPlayer(netgame, netgame.table, name);
                netgame._localPlayers[name] = we;
                if (typeof match[3] !== "undefined") {
                    for (let botname of match[3].split("+")) {
                        let bot = new BotPlayer(netgame, netgame.table, botname);
                        netgame._localPlayers[botname] = bot;
                    }
                }
                switchScreens("loading");
                netgame.joinGame(match[1], joinGame);
            } else {
                switchScreens("loading");
                netgame.joinGame(match[1], selectGame);
            }
        }
    } else {
        switchScreens("lobby");

        document.getElementById("createPrivateGame").onclick = () => {
            switchScreens("loading");
            netgame.createGame(false, proceedWithGameCreation);
        };

        document.getElementById("joinPublicGame").onclick = () => {
            switchScreens("loading");
            netgame.joinPublicGame(proceedWithGameCreation);
        };
    }
});
