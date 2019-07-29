const TheMostDistant = 2000000;

class SmartBot extends Player {

    makeMove(callback) {

        this.closesVal = TheMostDistant;
        console.log(this.name);
        let move = new Move();
        this.chooseBestCard();

        if (this.closesVal === TheMostDistant) {
            move.discard(this.hand[0]);
        } else {
            move.placeCard(this.bestcard, this.x, this.y);
        }
        console.dir(this.resultDijsktra);
        setTimeout(() => callback(move), 300);
    }

    chooseBestCard (){

        let validCells = this.table.field.reachableSpaces();
        this.resultDijsktra = {};

        for (let [a, b] of validCells) {//!
            let key = a + "," + b;
            this.resultDijsktra[key] = this.dijkstra([a, b]);
            let bestAdjCell = this.determineAdjCells(this.resultDijsktra[key]);

            for (let cell of bestAdjCell){
                for (let card of this.hand) {
                    let [notreversed, reversed]= this.table.field.canPlaceInPosition(card, a, b);//!
                    if (!notreversed && !reversed){
                             continue;
                        }
                    if (notreversed&& reversed) {//!
                        this.compareCards(card, cell, a, b);
                        this.compareCards(-card, cell, a, b);
                    }
                    else {
                        if (notreversed){
                            card = Math.abs(card);
                        }
                        else {
                            card = -Math.abs(card);
                        }
                        this.compareCards(card, cell, a, b);
                    }
                }
            }
        }
    }

    compareCards (card, cell, a, b){

        if (this.canLead(card, cell, a, b)) {
            if (cell.distToValidCell <= this.closesVal){
                let vailableSpaces = this.table.field.availableSpaces(card);
                let compare = [a, b];
                if (doesIncludeArray(vailableSpaces, compare)){
                    this.closesVal = cell.distToValidCell;
                    this.x = a;
                    this.y = b;
                    this.bestcard = card;
                }
            }
        }
    }

    dijkstra(apex){

        let beginver = new Vertex(true, 0, undefined, apex);
        let apexstr = apex[0] + " , " + apex[1];
        let vertexes = new Object();
        vertexes[apexstr] = beginver;

        let posDirect = [[1, 0,"left", "right"], [0, 1, "up", "down"], [-1, 0,"right", "left"], [0, -1,"down", "up"]];
        while(true){
            for (let [a, b, c, d] of posDirect){
                if (this.table.field.grid[apex[0]][apex[1]] !== undefined &&
                 dirs(this.table.field.grid[apex[0]][apex[1]])[d] !== "yes"){
                    continue;
                }
                if (Math.abs(b + apex[1]) > 3 || apex[0] + a < -2 || apex[0] + a > 10){
                    continue;
                }
                if (this.table.field.grid[apex[0] + a] [apex[1] +b] !== undefined){
                    if (dirs(this.table.field.grid[apex[0] + a] [apex[1] +b])[c] !== "yes"){
                        continue;
                    }
                }
                let key = [apex[0] + a] + " , " + [apex[1] +b];
                if (vertexes.hasOwnProperty(key)){
                    if (vertexes[key].isVisited){
                        continue;
                    }
                    if (vertexes[key].dist < vertexes[apexstr].dist + 1){
                        vertexes[key].dist = vertexes[apexstr].dist + 1;
                        //vertexes[key].parent.push(apex);
                        vertexes[key].parent =  apex;
                    }
                }
                else{
                    let vertex = new Vertex(false, vertexes[apexstr].dist + 1, vertexes[apexstr], [apex[0] + a, apex[1] +b]);
                    vertexes[key] = vertex;
                }
            }

            let mindist = TheMostDistant;
            for (let key in vertexes){
                if (vertexes[key].dist < mindist && vertexes[key].isVisited === false){
                    mindist = vertexes[key].dist;
                    apexstr = key;
                    apex = vertexes[key].index;
                }
            }
            vertexes[apexstr].isVisited = true;
            if (mindist === TheMostDistant){
                return vertexes;
            }
        }
    }

    canLead(card, cell, a, b){

        let botfield = new BotField(this.table.field.grid);
        botfield.grid[a][b] = card;
        let visited = botfield.reachableSpaces();
        botfield.grid[a][b] = undefined;
        return (visited.has(cell.index[0] + " " + cell.index[1]));
    }

    determineAdjCells(graph){

        let finishPoints = [[8, 0], [8, -2], [8, 2]];
        let index = 0;
        for (let f of finishPoints){
            if (this.table.field.grid[f[0]][f[1]] !== undefined){
                finishPoints = finishPoints.splice(index);
            }
            ++index;
        }

        let result = [];
        for (let [a, b] of finishPoints){
            let prevcell;
            let distToValidCell = 0;
            let iterat = graph[a + " , " + b];
            while(iterat.parent != undefined){
                iterat.distToValidCell = ++distToValidCell;
                prevcell = iterat;
                iterat = iterat.parent;
            }
            result.push(prevcell);
        }
        result.sort((a, b) =>{
            return b.distToValidCell - a.distToValidCell;
        });
        return result;
    }
}

class Vertex {
    constructor(visit, dist, parent, index){
        this.isVisited = visit;
        this.dist = dist;
        this.parent = parent;
        this.index = index;
    }
};

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