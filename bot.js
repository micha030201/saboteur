class SmartBot extends Player {

	makeMove(callback) {

		this.closesVal = 2000000;
        console.log(this.name);
        let move = new Move();
        let validCells = this.table.field.reachableSpaces(); 
        this.resultD ={};                     

        for (let i of validCells) {
        	let key = i[0] + "," + i[1];        	
        	this.resultD[key] = this.dijkstra(i);
        	let bestAdjCell = this.determineAdjCells(this.resultD[key]);

        	for (let cell of bestAdjCell){        		
		        for (let card of this.hand) {
		        	let canBePlaced = this.table.field.canPlaceInPosition(card, i[0], i[1]);
		        	if (!canBePlaced[0] && !canBePlaced[1]){
	                		 continue;
                		}
		            if (canBePlaced[0] && canBePlaced[1]) {//!
	                	card = Math.abs(card);
                	 	this.compareCards(card, cell, i[0], i[1]);

                		card = - Math.abs(card);
                		this.compareCards(card, cell, i[0], i[1]);             	
	            	}
	            	else {
	            		if (canBePlaced[0]){
							card = Math.abs(card);
	            		}
	            		else {
            				card = -Math.abs(card);
	            		}	                	
                		this.compareCards(card, cell, i[0], i[1]);                		
	            	}            	
		        }
	    	}
        }

        if (this.closesVal === 2000000) {
            move.discard(this.hand[0]);
        } else {            
            move.placeCard(this.bestcard, this.x, this.y);
        }
        console.dir(this.resultD);
        setTimeout(() => callback(move), 300);
    }

    compareCards (card, cell, a, b){

		if (this.canLead(card, cell, a, b)) {
			if (cell.distToValidCell <= this.closesVal){
				let vailableSpaces = table.field.availableSpaces(card);
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
    			if (table.field.grid[apex[0]][apex[1]] !== undefined &&
    			 dirs(table.field.grid[apex[0]][apex[1]])[d] !== "yes"){
    				continue;
    			}
    			if (Math.abs(b + apex[1]) > 3 || apex[0] + a < -2 || apex[0] + a > 10){
                	continue;
        		}    			
    			if (table.field.grid[apex[0] + a] [apex[1] +b] !== undefined){
    				if (dirs(table.field.grid[apex[0] + a] [apex[1] +b])[c] !== "yes"){
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
    		
    		let mindist = 2000000;
    		for (let key in vertexes){
    			if (vertexes[key].dist < mindist && vertexes[key].isVisited === false){
    				mindist = vertexes[key].dist;
    				apexstr = key;
    				apex = vertexes[key].index;
    			}
    		}
    		vertexes[apexstr].isVisited = true; 
    		if (mindist === 2000000){
    			return vertexes;
    		}
    	}
    }

 	canLead(card, cell, a, b){

		let botfield = new BotField(table.field.grid);
		botfield.grid[a][b] = card;    
		let visited = botfield.reachableSpaces();
		botfield.grid[a][b] = undefined;
		return (visited.has(cell.index[0] + " " + cell.index[1]));
	}

    determineAdjCells(graph){

    	let finishPoints = [[8, 0], [8, -2], [8, 2]];
    	let index = 0;
    	for (let f of finishPoints){    		
    		if (table.field.grid[f[0]][f[1]] !== undefined){
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