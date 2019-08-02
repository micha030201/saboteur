class CommonBot extends Player{

    constructor (...args){

        super(...args);
        this.bot = undefined;
    }

    makeMove (callback){

        if (this.bot === undefined){
            if (this.role === "miner"){
                let type = Math.floor(Math.random() * 2);
                if (type){
                    this.bot = new SmartBot (this.netgame, this.table, this.name);
                } else{
                    this.bot = new DirectionBot (this.netgame, this.table, this.name, "right");
                }
            } else{
                this.determineBadass();
            }
        }
        this.bot.makeMove (callback, this.hand);
    }

    determineBadass (){

        let types = [MostDistantBot, SmartBadBot, BotPlayer, DirectionBot];
        let type = Math.floor(Math.random() * 4);
        if (type !== 3){
            this.bot = new types[type] (this.netgame, this.table, this.name);
        } else {
            let sides  = ["right", "left", "up", "down"];
            let side = Math.floor(Math.random() * 4);
            this.bot = new types[type] (this.netgame, this.table, this.name, sides[side]);
        }
    }
}

class BotPlayer extends Player {
    constructor(...args) {
        super(...args);
    }

    makeMove(callback) {
        console.log(this.name);

        let move = new Move();
        let spaces = [], card;
        for (card of this.hand) {
            if (type(card) !== "path"){
                move = trySpecal(this, card);
                this.netgame.sendMove(this, move);
                setTimeout(() => callback(move), 0);
                return;
            }
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
           if (!canPlayPath (this.impairments)){
                move.discard(this.hand[0]);
           } else{
                move.placeCard(card, a, b);
           }
        }

        this.netgame.sendMove(this, move);
        setTimeout(() => callback(move), 0);
    }
}

class SmartBot  extends Player{

        constructor(...args) {
        super(...args);
    }
    makeMove(callback, hand) {

        this.hand = hand;
        this.bestcard = undefined;
        console.log(this.name + " " + "smartbot");
        let move = new Move();
        this.Bfs();

        if (this.bestcard === undefined) {
            let isPlayed = false;
            for (let card of this.hand){
                if (type(card) !== "path"){
                    isPlayed = true;
                    move = trySpecal(this, card);
                }
            }
            if (!isPlayed){
                move.discard(hand[0]);
            }
        } else {
            if (!canPlayPath (this.impairments)){
                move.discard(this.hand[0]);
           } else{
                move.placeCard(this.bestcard, this.x, this.y);
            }
        }
         this.netgame.sendMove(this, move);
        setTimeout(() => callback(move), 0);
    }

    compareCards (card, cell, a, b){

        if (this.canLead(card, cell, a, b)) {
            let vailableSpaces = this.table.field.availableSpaces(card);
            let compare = [a, b];
            if (doesIncludeArray(vailableSpaces, compare)){
                this.x = a;
                this.y = b;
                this.bestcard = card;
            }
        }
    }

    Bfs(){

        let validCells = this.table.field.reachableSpaces();
        let parentKey;
        let vertexes = {};
        let queueBfs = [];
        let finishPoints = [[8, 0], [8, -2], [8, 2]];

        for (let [x, y] of finishPoints){
            if (this.table.field.grid[x][y] !== undefined){
                continue;
            }
            let finishVertex = new Vertex(0, x, y);
            parentKey = x + " , " + y;
            vertexes[parentKey] = finishVertex;
            queueBfs.push(finishVertex);
        }
        let posDirect = [[1, 0,"left", "right"], [0, 1, "up", "down"], [-1, 0,"right", "left"], [0, -1,"down", "up"]];
        let currentVertex;

        while (queueBfs.length){
            currentVertex = queueBfs.shift();
            for (let [biasX, biasY, where, from] of posDirect){

                biasX += currentVertex.x;
                biasY += currentVertex.y;
                if (this.canPassThrough(currentVertex.x, currentVertex.y, where) ||
                            this.canPassThrough(biasX, biasY, from) ||
                                !(Field.isInside(biasX, biasY))) {
                    continue;
                }

                let key = (biasX) + " , " + (biasY);
                if (!vertexes.hasOwnProperty(key)){
                    let vertex = new Vertex(currentVertex.dist + 1, biasX, biasY);
                    if (this.canBePlaced(vertex, validCells, currentVertex)){
                        return;
                    }
                    queueBfs.push(vertex);
                    vertexes[key] = vertex;
                }
            }
        }
    }

    canBePlaced(vertex, validCells, parent){

        if (!doesIncludeArray(validCells, ([vertex.x, vertex.y]))){
            return false;
        }
        for (let card of this.hand) {
            if (type(card) !== "path"){
                continue;
            }
            let [notreversed, reversed] = this.table.field.canPlaceInPosition(card, vertex.x, vertex.y);
            if (!notreversed && !reversed){
                     continue;
                }
            if (notreversed && reversed) {
                this.compareCards(card, parent, vertex.x, vertex.y);
                this.compareCards(-card, parent, vertex.x, vertex.y);
            }
            else {
                if (notreversed){
                    card = Math.abs(card);
                }
                else {
                    card = -Math.abs(card);
                }
                this.compareCards(card, parent, vertex.x, vertex.y);
            }
        }
        return (this.bestcard !== undefined);
    }

    canPassThrough(x, y, direction){
        return (this.table.field.grid[x][y] !== undefined &&
                 dirs(this.table.field.grid[x][y])[direction] !== "yes");
    }

    canLead(card, cell, a, b){

        let botfield = new BotField(this.table.field.grid);
        botfield.grid[a][b] = card;
        let visited = botfield.reachableSpaces();
        botfield.grid[a][b] = undefined;
        return (visited.has(cell.x + " " + cell.y));
    }
}

class Vertex {
    constructor(dist, x, y){
        this.dist = dist;
        this.x = x;
        this.y = y;
    }
}

class BotField extends Field{

    constructor (area){
        super();
        this.grid = cloneObject(area);
    }

    reachableSpaces() {
    let result = [];
    let visited = new Set(["0 0"]);
    this._reachableSpaces(visited, result, 0, 0, "up");
    return visited;
    }
}

class MostDistantBot extends SmartBot{

    makeMove(callback, hand) {

        this.hand = hand;
        this.bestcard = undefined;
        console.log(this.name + " " + "mostDistantBot");
        let move = new Move();
        this.Bfs();

        if (this.bestcard === undefined) {
            let isPlayed = false;
            for (let card of this.hand){
                if (type(card) !== "path"){
                    move = trySpecal(this, card);
                    isPlayed = true;
                }
            }
            if (!isPlayed){
                move.discard(this.hand[0]);
            }

        } else {
            if (!canPlayPath (this.impairments)){
                move.discard(this.hand[0]);
           } else{
                move.placeCard(this.bestcard, this.x, this.y);
            }
        }
        this.netgame.sendMove(this, move);
        setTimeout(() => callback(move), 0);
    }

    canBePlaced(vertex, validCells, parent){

        if (!doesIncludeArray(validCells, ([vertex.x, vertex.y]))){
            return false;
        }
        for (let card of this.hand) {
            if (type(card) !== "path"){
                continue;
            }
            let [notreversed, reversed]= this.table.field.canPlaceInPosition(card, vertex.x, vertex.y);
            if (!notreversed && !reversed){
                     continue;
                }
            if (notreversed && reversed) {
                this.compareCards(card, parent, vertex.x, vertex.y);
                this.compareCards(-card, parent, vertex.x, vertex.y);
            }
            else {
                if (notreversed){
                    card = Math.abs(card);
                }
                else {
                    card = -Math.abs(card);
                }
                this.compareCards(card, parent, vertex.x, vertex.y);
            }
        }
        return (false);
    }

}

class DirectionBot extends Player{

    constructor(netgame, table, name, direct) {
        super(netgame, table, name);
        let tableDirect = [["right", -3, 0, ">"], ["left", 13, 0, "<"], ["up", 4, 1, "<"], ["down", -4, 1, ">"]];
        for (let [a, b, c, d] of tableDirect){
            if (a === direct){
                this.comparisionValue = b;
                this.side = c;
                this.direct = direct;
                this.sign = d;
            }
        }
    }

    makeMove(callback, hand) {

        this.hand = hand;
        let turnComparisionValue = this.comparisionValue;
        console.log(this.name + "  directbot");
        let move = new Move();
        let placmentCoord;
        for (let card of this.hand){
            if (type(card) !== "path"){
                move = trySpecal(this, card);
                this.netgame.sendMove(this, move);
                setTimeout(() => callback(move), 0);
                return;
            }
            let spaces = this.table.field.availableSpaces(card);
            for (let i of spaces){
                if (this.sign === ">"){
                    if (i[this.side] > turnComparisionValue){
                        turnComparisionValue = i[this.side];
                        placmentCoord = i;
                        this.bestcard = card;
                    }
                }
                else{
                    if (i[this.side] <  turnComparisionValue){
                        turnComparisionValue = i[this.side];
                        placmentCoord = i;
                        this.bestcard = card;
                    }
                }
            }
        }

        if (turnComparisionValue === this.comparisionValue) {
            move.discard(this.hand[0]);
        } else {
            if (!canPlayPath (this.impairments)){
                move.discard(this.hand[0]);
           } else{
                move.placeCard(this.bestcard, placmentCoord[0], placmentCoord[1]);
            }
        }
        this.netgame.sendMove(this, move);
        setTimeout(() => callback(move), 0);
    }

}

class SmartBadBot extends MostDistantBot{

    makeMove(callback, hand) {

        this.hand = hand;
        this.realBestCard = undefined;
        this.IsBestFound = false;
        this.bestcard = undefined;
        this.worstCard = undefined;
        console.log(this.name + " " + "MostDistantBot");
        let move = new Move();
        this.Bfs();

        if (this.bestcard === undefined && this.worstCard == undefined) {
            let isPlayed = false;
            for (let card of this.hand){
                if (type(card) !== "path"){
                    isPlayed = true;
                    move = trySpecal(this, card);
                }
            }
            if (!isPlayed){
                move.discard(hand[0]);
            }
            this.netgame.sendMove(this, move);
            setTimeout(() => callback(move), 0);
        } else {
            if (this.worstCard !== undefined){
                let finishPoints = [[8, 0], [8, -2], [8, 2]];
                for (let [x, y] of finishPoints){
                    if (Math.sqrt(Math.pow(x - this.realX) + Math.pow(y - this.realY)) <= 3){
                        if (!canPlayPath (this.impairments)){
                             move.discard(this.hand[0]);
                         } else{
                            move.placeCard(this.worstCard, this.badX, this.badY);
                        }
                        this.netgame.sendMove(this, move);
                        setTimeout(() => callback(move), 0);
                        return;
                    }
                }
            }
            if (this.bestcard !== undefined){
                if (!canPlayPath (this.impairments)){
                move.discard(this.hand[0]);
                } else{
                    move.placeCard(this.bestcard, this.x, this.y);
                }
                this.netgame.sendMove(this, move);
                setTimeout(() => callback(move), 0);
            }else{
                move.discard(this.hand[0]);
                this.netgame.sendMove(this, move);
                setTimeout(() => callback(move), 0);
            }
        }
    }

    compareCards (card, cell, a, b){

        super.compareCards(card, cell,a, b);
        if (this.bestcard !== undefined && !this.IsBestFound){
            this.realBestCard = this.bestcard;
            this.realX = this.x;
            this.realY = this.y;
            this.IsBestFound = true;
        }
        if (!this.canLead(card, cell, a, b)) {
            let vailableSpaces = this.table.field.availableSpaces(card);
            let compare = [a, b];
            if (doesIncludeArray(vailableSpaces, compare)){
                this.badX = a;
                this.badY = b;
                this.worstCard = card;
            }
        }
    }
}

function trySpecal (bot, card){

    let move = new Move();
    switch (type(card)){
        case "destroy" :
            let x = getRandomInt(19) - 5;
            let y = getRandomInt(15) - 7;
            if (bot.table.field.canBeRemoved (x, y)){
                move.destroy(card, x, y);
            }
            else{
                move.discard(card);
            }
            break;

        case "map" :
            let index = 0;
            for (let finish of bot.seenFinishCards){
                if (!finish){
                    move.look(card, index);
                    return move;
                }
                ++index;
            }
            move.discard(card);
            break;

        case "impair" :
            for (let player of bot.table.players){
                if (player.name !== bot.name){
                    let imprType = impairmentType(card);
                    if (player.impairments[imprType] === null){
                        move.impair(card, player);
                        return move;
                    }
                }
            }
            move.discard(card);
            break;

        case "repair" :

            for (let player of bot.table.players){
                    let imprType = impairmentType(card);
                    if (player.impairments[imprType] !== null){
                        move.repair(card, player);
                        return move;
                    }
                }
                move.discard(card);
                break;
        default :
            move.discard(card);
            break;
    }
    return move;
}

function canPlayPath(impairments){
    for (let imp of impairments){
        if (imp !== null){
            return false;
        }
    }
    return true;
}