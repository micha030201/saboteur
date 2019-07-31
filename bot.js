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

class SmartBot extends Player {

    makeMove(callback) {

        this.bestcard = undefined;
        console.log(this.name + " " + "smartbot");
        let move = new Move();
        this.Bfs();

        if (this.bestcard === undefined) {
            move.discard(this.hand[0]);
        } else {
            move.placeCard(this.bestcard, this.x, this.y);
        }
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
                        Math.abs(biasY) > 3 || biasX < -2 || biasX > 10 ||
                            this.canPassThrough(biasX, biasY, from)) {
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

    makeMove(callback) {

        this.bestcard = undefined;
        console.log(this.name + " " + "mostDistantBot");
        let move = new Move();
        this.Bfs();

        if (this.bestcard === undefined) {
            move.discard(this.hand[0]);
        } else {
            move.placeCard(this.bestcard, this.x, this.y);
        }
        setTimeout(() => callback(move), 0);
    }

    canBePlaced(vertex, validCells, parent){

        if (!doesIncludeArray(validCells, ([vertex.x, vertex.y]))){
            return false;
        }
        for (let card of this.hand) {
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

    constructor(table, name, allegiance, direct) {
        super(table, name, allegiance);
        let tableDirect = [["right", -3, 0, ">"], ["left", 13, 0, "<"], ["up", 4, 1, "<"], ["down", -4, 1, ">"]];
        for (let [a, b, c, d] of tableDirect){
            if (a === direct){
                this.comparisionValue = b;
                this.side = c;
                this. direct = direct;
                this.sign = d;
            }
        }
    }

    makeMove(callback) {

        let turnComparisionValue = this.comparisionValue;
        console.log(this.name + "  directbot");
        let move = new Move();
        let placmentCoord;
        for (let card of this.hand){
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
            move.placeCard(this.bestcard, placmentCoord[0], placmentCoord[1]);
        }
        setTimeout(() => callback(move), 0);
    }

}

class SmartBadBot extends MostDistantBot{

    makeMove(callback) {

        this.realBestCard = undefined;
        this.IsBestFound = false;
        this.bestcard = undefined;
        this.worstCard = undefined;
        console.log(this.name + " " + "MostDistantBot");
        let move = new Move();
        this.Bfs();

        if (this.bestcard === undefined && this.worstCard == undefined) {
            move.discard(this.hand[0]);
        } else {
            if (this.worstCard !== undefined){
                let finishPoints = [[8, 0], [8, -2], [8, 2]];
                for (let [x, y] of finishPoints){
                    if (Math.sqrt(Math.pow(x - this.realX) + Math.pow(y - this.realY)) <= 3){
                        move.placeCard(this.worstCard, this.badX, this.badY);
                        setTimeout(() => callback(move), 0);
                        return;
                    }
                }
            }
            move.placeCard(this.bestcard, this.x, this.y);
            setTimeout(() => callback(move), 0);
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