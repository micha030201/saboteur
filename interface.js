
"use strict"
/* global finishCardIndex finishCardAB type impairmentType DefaultDict Player Move shuffle symmetrical NetGame roleOffsets sprite cover CommonBot */

const ANIMATION_LENGTH = 600;  // in milliseconds

// has to correspond to assets/* image sizes
const SPRITE_WIDTH = 10;
const SPRITE_HEIGHT_RATIO = 538 / 380;

const COORDINATES_TALL = {
    TOTAL_CARDS_HORIZONTALLY: 18,
    TOTAL_CARDS_VERTICALLY: 21,

    ZERO_A: 4,
    ZERO_B: 11,

    // coordinates below relative to zero

    BACKGROUND_A: -4.5,
    BACKGROUND_B: -11.5,

    LEAVE_A: 12,
    LEAVE_B: -11,

    DISCARD_PILE_A: 12,
    DISCARD_PILE_B: -8,

    DECK_A: 12,
    DECK_B: -10,

    OUR_HAND_A: -3,
    OUR_HAND_B: 8,

    OUR_HAND_CARDS_OFFSET_A: 2,
    OUR_HAND_CARDS_OFFSET_B: 0,

    OUR_HAND_IMPAIR_OFFSET_A: 9,
    OUR_HAND_IMPAIR_OFFSET_B: 0,

    OUR_HAND_NEXT_CARD_OFFSET_A: 1,
    OUR_HAND_NEXT_CARD_OFFSET_B: 0,

    OUR_HAND_ROTATE_ICON_OFFSET_A: 0,
    OUR_HAND_ROTATE_ICON_OFFSET_B: -1,

    OTHER_HANDS_A: -4,
    OTHER_HANDS_B: -8,

    OTHER_HANDS_NEXT_HAND_OFFSET_A: 4,
    OTHER_HANDS_NEXT_HAND_OFFSET_B: 0,

    OTHER_HANDS_IN_ROW: 4,

    OTHER_HANDS_NEXT_ROW_OFFSET_A: 0,
    OTHER_HANDS_NEXT_ROW_OFFSET_B: -2,

    CARD_ENLARGED_A: 2,
    CARD_ENLARGED_B: 2,
    CARD_ENLARGED_WIDTH: 5,
};

const COORDINATES_WIDE = {
    TOTAL_CARDS_HORIZONTALLY: 28,
    TOTAL_CARDS_VERTICALLY: 14,

    ZERO_A: 12,
    ZERO_B: 6,

    // coordinates below relative to zero

    BACKGROUND_A: -12.5,
    BACKGROUND_B: -6.5,

    LEAVE_A: -10,
    LEAVE_B: -6,

    DISCARD_PILE_A: -6,
    DISCARD_PILE_B: -6,

    DECK_A: -8,
    DECK_B: -6,

    OUR_HAND_A: 14,
    OUR_HAND_B: -6,

    OUR_HAND_CARDS_OFFSET_A: 0,
    OUR_HAND_CARDS_OFFSET_B: 2,

    OUR_HAND_IMPAIR_OFFSET_A: 0,
    OUR_HAND_IMPAIR_OFFSET_B: 9,

    OUR_HAND_NEXT_CARD_OFFSET_A: 0,
    OUR_HAND_NEXT_CARD_OFFSET_B: 1,

    OUR_HAND_ROTATE_ICON_OFFSET_A: -1,
    OUR_HAND_ROTATE_ICON_OFFSET_B: 0,

    OTHER_HANDS_A: -8,
    OTHER_HANDS_B: -3,

    OTHER_HANDS_NEXT_HAND_OFFSET_A: 0,
    OTHER_HANDS_NEXT_HAND_OFFSET_B: 3,

    OTHER_HANDS_IN_ROW: 4,

    OTHER_HANDS_NEXT_ROW_OFFSET_A: -4,
    OTHER_HANDS_NEXT_ROW_OFFSET_B: 0,

    CARD_ENLARGED_A: 7,
    CARD_ENLARGED_B: 1,
    CARD_ENLARGED_WIDTH: 5,
};

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
        this.whoseTurn = null;
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

    drawCardEnlarged(card) {
        let reversed = card < 0;
        let c = this.cardCacheEntry(card);

        let [x, y] = this.ABtoXY(this.c.CARD_ENLARGED_A, this.c.CARD_ENLARGED_B);

        this.svg.appendChild(c.outerGroup);
        if (
            c.x !== x
            || c.y !== y
            || c.hidden !== false
            || c.reversed !== reversed
            || c.width !== this.cardWidth * this.c.CARD_ENLARGED_WIDTH
        ) {
            c.cover.a("opacity", 0);

            c.animateTransform.a("from", `${x}, ${y}`);
            c.animateTransform.a("to", `${x}, ${y}`);
            c.animateTransform.beginElement();

            c.innerGroup.a(
                "transform",
                `scale(${this.cardWidth * this.c.CARD_ENLARGED_WIDTH / SPRITE_WIDTH})
                 rotate(${reversed ? 180 : 0} ${SPRITE_WIDTH / 2} ${SPRITE_WIDTH * SPRITE_HEIGHT_RATIO / 2})`
            );

            c.x = x;
            c.y = y;
            c.hidden = false;
            c.reversed = reversed;
            c.width = this.cardWidth;
        }
    }

    _drawName(player, x, y, anchorEnd) {
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
            "text-anchor", anchorEnd ? "end" : "start",
        );
        if (player === this.we || this.table.gameOver) {
            elem.textContent = `${player.name} (${player.role})`;
        } else {
            elem.textContent = player.name;
        }
    }

    _whereDrawOtherHand(player) {
        let index = this.otherPlayers.indexOf(player);
        return [
            this.c.OTHER_HANDS_A + (index % this.c.OTHER_HANDS_IN_ROW) * this.c.OTHER_HANDS_NEXT_HAND_OFFSET_A + (index > this.c.OTHER_HANDS_IN_ROW ? this.c.OTHER_HANDS_NEXT_ROW_OFFSET_A : 0),
            this.c.OTHER_HANDS_B + (index % this.c.OTHER_HANDS_IN_ROW) * this.c.OTHER_HANDS_NEXT_HAND_OFFSET_B + (index > this.c.OTHER_HANDS_IN_ROW ? this.c.OTHER_HANDS_NEXT_ROW_OFFSET_B : 0),
        ];
    }

    _whoseHandThere(a, b) {
        if (a === this.c.OUR_HAND_A && b === this.c.OUR_HAND_B) {
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
            return [
                this.c.OUR_HAND_A + this.c.OUR_HAND_IMPAIR_OFFSET_A + index * this.c.OUR_HAND_NEXT_CARD_OFFSET_A,
                this.c.OUR_HAND_B + this.c.OUR_HAND_IMPAIR_OFFSET_B + index * this.c.OUR_HAND_NEXT_CARD_OFFSET_B,
            ];
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
                this.destroyPickHandler(card);
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
            this.drawCard(card, this.c.DECK_A, this.c.DECK_B, true, instant);
            this.destroyPickHandler(card);
        }
    }

    drawDiscardPile(instant) {
        let elem = document.getElementById("discardPile");
        elem.a(
            "x", this.zeroX + this.cardWidth * this.c.DISCARD_PILE_A,
            "y", this.zeroY + this.cardWidth * SPRITE_HEIGHT_RATIO * this.c.DISCARD_PILE_B,
            "width", this.cardWidth,
            "height", this.cardWidth * SPRITE_HEIGHT_RATIO,
        );

        for (let card of this.table.discardPile) {
            this.drawCard(card, this.c.DISCARD_PILE_A, this.c.DISCARD_PILE_B, false, instant);
            this.destroyPickHandler(card);
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
                this.destroyPickHandler(this.table.finishCards[index]);
            }
        }

        for (let [a, b, card] of this.table.field.cards()) {
            this.drawCard(card, a, b, false, instant);
            this.destroyPickHandler(card);
        }
    }

    _canBePlaced(card, a, b) {
        if (card === null) {
            return false;
        }
        let playerThere = this._whoseHandThere(a, b);
        return (
            (a === this.c.DISCARD_PILE_A && b === this.c.DISCARD_PILE_B)
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
        if (a === this.c.DISCARD_PILE_A && b === this.c.DISCARD_PILE_B) {
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
            possibleAvailableSpaces.push([this.c.OUR_HAND_A, this.c.OUR_HAND_B]);
            possibleAvailableSpaces.push([this.c.DISCARD_PILE_A, this.c.DISCARD_PILE_B]);

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
            "x", this.zeroX + this.cardWidth * (this.c.OUR_HAND_A + this.c.OUR_HAND_CARDS_OFFSET_A + index * this.c.OUR_HAND_NEXT_CARD_OFFSET_A + this.c.OUR_HAND_ROTATE_ICON_OFFSET_A),
            "y", this.zeroY + this.cardWidth * SPRITE_HEIGHT_RATIO * (this.c.OUR_HAND_B + this.c.OUR_HAND_CARDS_OFFSET_B + index * this.c.OUR_HAND_NEXT_CARD_OFFSET_B + this.c.OUR_HAND_ROTATE_ICON_OFFSET_B),
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
            "x", this.zeroX + this.cardWidth * (this.c.OUR_HAND_A + this.c.OUR_HAND_CARDS_OFFSET_A),
            "y", hide ? this.zeroY + this.cardWidth * SPRITE_HEIGHT_RATIO * (this.c.OUR_HAND_B + this.c.OUR_HAND_CARDS_OFFSET_B) : -9999,
            "width", this.cardWidth * (this.we.hand.length * this.c.OUR_HAND_NEXT_CARD_OFFSET_A || 1),
            "height", this.cardWidth * SPRITE_HEIGHT_RATIO * (this.we.hand.length * this.c.OUR_HAND_NEXT_CARD_OFFSET_B || 1),
            "opacity", 0.5,
        );
    }

    drawOurHand(instant) {
        if (this.c === COORDINATES_TALL) {
            let [x, y] = this.ABtoXY(this.c.OUR_HAND_A, this.c.OUR_HAND_B + 1 + 1/3);
            this._drawName(this.we, x, y);
        } else {
            let [x, y] = this.ABtoXY(this.c.OUR_HAND_A + 1, this.c.OUR_HAND_B - 1/5);
            this._drawName(this.we, x, y, true);
        }

        this.drawCard(roleOffsets[this.we.role] + this.we.id, this.c.OUR_HAND_A, this.c.OUR_HAND_B, false, instant);
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
            this.drawCard(
                card,
                this.c.OUR_HAND_A + this.c.OUR_HAND_CARDS_OFFSET_A + i * this.c.OUR_HAND_NEXT_CARD_OFFSET_A,
                this.c.OUR_HAND_B + this.c.OUR_HAND_CARDS_OFFSET_B + i * this.c.OUR_HAND_NEXT_CARD_OFFSET_B,
                false,
                instant
            );
            this.createPickHandler(card);
        }
        for (let [i, card] of this.we.impairments.entries()) {
            if (card !== null) {
                let [a, b] = this.impairCardAB(this.we, i);
                this.drawCard(card, a, b, false, instant);
            }
        }
        this._drawCardsHider(this.table.gameOver || !this.ourTurn);
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

        if (window.innerWidth < window.innerHeight) {
            this.c = COORDINATES_TALL;
        } else {
            this.c = COORDINATES_WIDE;
        }

        if (window.innerHeight / this.c.TOTAL_CARDS_VERTICALLY / SPRITE_HEIGHT_RATIO <= window.innerWidth / this.c.TOTAL_CARDS_HORIZONTALLY) {
            this.cardWidth = window.innerHeight / this.c.TOTAL_CARDS_VERTICALLY / SPRITE_HEIGHT_RATIO;
            this.zeroX = (window.innerWidth - this.cardWidth * (this.c.TOTAL_CARDS_HORIZONTALLY - 1)) / 2 + this.cardWidth * this.c.ZERO_A;
            this.zeroY = this.cardWidth * SPRITE_HEIGHT_RATIO * (this.c.ZERO_B + 0.5);
        } else {
            this.cardWidth = window.innerWidth / this.c.TOTAL_CARDS_HORIZONTALLY;
            this.zeroX = this.cardWidth * (this.c.ZERO_A + 0.5);
            this.zeroY = (window.innerHeight - this.cardWidth * SPRITE_HEIGHT_RATIO * (this.c.TOTAL_CARDS_VERTICALLY - 1)) / 2 + this.cardWidth * SPRITE_HEIGHT_RATIO * this.c.ZERO_B;
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
            "x", this.zeroX + this.c.BACKGROUND_A * this.cardWidth,
            "y", this.zeroY + this.c.BACKGROUND_B * this.cardWidth * SPRITE_HEIGHT_RATIO,
            "width", this.c.TOTAL_CARDS_HORIZONTALLY * this.cardWidth,
            "height", this.c.TOTAL_CARDS_VERTICALLY * this.cardWidth * SPRITE_HEIGHT_RATIO,
        );

        let leave = document.getElementById("leave");
        leave.a(
            "x", this.zeroX + this.cardWidth * this.c.LEAVE_A,
            "y", this.zeroY + this.cardWidth * SPRITE_HEIGHT_RATIO * this.c.LEAVE_B,
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
        if (this.table.gameOver) {
            this.drawCardEnlarged(this.table.goldFound ? 1100 : 2100);
        }
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
                this.drawCard(move.card, this.c.DISCARD_PILE_A, this.c.DISCARD_PILE_B);
                setTimeout(() => this.drawOtherHands(false), ANIMATION_LENGTH);

                moveAnimations += 2;
            } else if (move.type === "destroy") {
                this.drawCard(move.card, move.a, move.b);
                setTimeout(() => this.drawCard(move.card, this.c.DISCARD_PILE_A, this.c.DISCARD_PILE_B), ANIMATION_LENGTH * 2);
                setTimeout(() => this.drawDiscardPile(false), ANIMATION_LENGTH * 2);
                setTimeout(() => this.drawOtherHands(false), ANIMATION_LENGTH * 3);

                moveAnimations += 4;
            } else if (move.type === "look") {
                this.drawCard(move.card, ...finishCardAB[move.index]);
                setTimeout(() => this.drawCard(move.card, this.c.DISCARD_PILE_A, this.c.DISCARD_PILE_B), ANIMATION_LENGTH * 2);
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
                this.drawOurHand(false);

                moveAnimations += 1;
            } else if (move.type === "discard") {
                this.drawOurHand(false);

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

        this.whoseTurn = this.table.nextPlayer(player).name;
        this.ourTurn = !this.table.gameOver && this.table.nextPlayer(player).name === this.we.name;
        setTimeout(() => this.drawOurHand(true), ANIMATION_LENGTH * moveAnimations);
    }

    followEvent(e) {
        let x, y;
        if (typeof e.changedTouches !== "undefined") {
            x = e.changedTouches[0].clientX - this.cardWidth * 1.2;
            y = e.changedTouches[0].clientY - this.cardWidth * SPRITE_HEIGHT_RATIO - this.cardWidth * 0.8;
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

    destroyPickHandler(card) {
        let elem = this.cardCacheEntry(card).outerGroup;

        elem.onmousedown = null;
        elem.ontouchstart = null;
    }

    createPickHandler(card) {
        let elem = this.cardCacheEntry(card).outerGroup;

        let detachCallbacks = () => {
            this.svg.onmousedown = null;
            this.svg.onmouseup = null;
            this.svg.onmousemove = null;
            this.svg.ontouchstart = null;
            this.svg.ontouchend = null;
            this.svg.ontouchcancel = null;
            this.svg.ontouchmove = null;

            elem.onmousedown = null;
            elem.ontouchstart = null;
            elem.ontouchend = null;
            elem.ontouchcancel = null;
        };

        let pick = (e) => {
            e.stopPropagation();
            if (!this.correctEventType(e)) {
                return;
            }
            if (this.we.moveDone !== null) {
                let [a, b] = this.followEvent(e);
                this._drawAvailableSpaces(card);
                this._drawRotateIcon(this.we.hand.indexOf(card), false);
                this.drawCard(card, a, b, false, true);

                let noPick = (e) => {
                    e.stopPropagation();
                    if (!this.correctEventType(e)) {
                        return;
                    }

                    detachCallbacks();
                    this.drawOurHand(true);
                };

                let enlarge = (e) => {
                    e.stopPropagation();
                    if (!this.correctEventType(e)) {
                        return;
                    }

                    this.drawOurHand(true);
                    this.drawCardEnlarged(card);

                    detachCallbacks();

                    elem.onmousedown = drag;
                    elem.ontouchstart = drag;

                    this.svg.onmousedown = noPick;
                    this.svg.ontouchstart = noPick;
                };

                let drag = (e) => {
                    e.stopPropagation();
                    if (!this.correctEventType(e)) {
                        return;
                    }

                    detachCallbacks();

                    this.svg.onmousemove = drag;
                    this.svg.ontouchmove = drag;

                    elem.onmousedown = drop;
                    elem.ontouchend = drop;
                    elem.ontouchcancel = drop;

                    let [a, b] = this.followEvent(e);

                    if (this._canBePlaced(card, Math.round(a), Math.round(b))) {
                        a = Math.round(a);
                        b = Math.round(b);
                    }

                    this.drawCard(card, a, b, false, true);
                };

                let drop = (e) => {
                    e.stopPropagation();
                    if (!this.correctEventType(e)) {
                        return;
                    }

                    detachCallbacks();

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

                detachCallbacks();

                this.svg.ontouchend = enlarge;
                this.svg.ontouchcancel = enlarge;

                this.svg.onmousemove = drag;
                this.svg.ontouchmove = drag;
            }
        };

        elem.onmousedown = pick;
        elem.ontouchstart = pick;
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
            window.location.hash = `#${netgame.roomCode}/${we.name}`;
            netgame.addPlayer(we, (success) => {
                if (!success) {
                    switchScreens("joinFail");
                } else {
                    switchScreens("gameJoinedControls");

                    document.getElementById("addBot").onclick = () => {
                        let bot = new CommonBot(netgame, netgame.table, randomBotName());
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
                        let bot = new CommonBot(netgame, netgame.table, randomBotName());
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
            let bot = new CommonBot(netgame, netgame.table, randomBotName());
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
                        let bot = new CommonBot(netgame, netgame.table, botname);
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
