class SmartBot extends Player {

	makeMove(callback) {

        console.log(this.name);
        let move = new Move();

        let validCells = this.table.field.reachableSpaces();
        let resultD = {};
        let closesVal = 2000000;

        for (let i of validCells) {
        	let key = i[0] + "," + i[1];        	
        	resultD[key] = this.dijkstra(i);
        	let bestAdjCell = this.determineAdjCells(resultD[key]);

        	for (let cell of bestAdjCell){        		
		        for (let card of this.hand) {
		            if (this.table.field.canBePlaced(card, i[0], i[1])) {
	                	card = Math.abs(card);
	                	this.canLead(card, cell, i[0], i[1]);
	            	} else {
	                	if (this.table.field.canBePlaced(card, i[0], i[0]) !== [false, false]){
	                		 card = -Math.abs(card);
                		}
	            	}
		        }
	    	}
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

        setTimeout(() => callback(move), 300);
    }

    dijkstra(apex){
    	
    	let beginver = new Vertex(true, 0, apex, apex);
    	let apexstr = apex[0] + " , " + apex[1];    	
    	let vertexes = {apexstr: beginver};    	 

    	let posDirect = [[1, 0,"left", "right"], [0, 1, "up", "down"], [-1, 0,"right", "left"], [0, -1,"down", "up"]];
    	while(true){    		
    		for (let [a, b, c, d] of posDirect){
    			if (table.field.grid[apex[0]][apex[1]] !== undefined &&
    			 dirs(table.field.grid[apex[0]][apex[1]])[d] !== "yes"){
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
					if (vertexes[key].dist <= vertexes[apexstr].dist + 1){
						vertexes[key].dist = vertexes[apexstr].dist + 1;
						//vertexes[key].parent.push(apex);
					}
				}
				else{
					let vertex = new Vertex(false, vertexes[apexstr].dist + 1, apex, [apex[0] + a] [apex[1] +b]);
					vartexes[key] = vertex;
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

    determineAdjCells(graph){

    	let finishPoints[[8, 0], [8, -2], [8, 2]];
    	let result = [];
    	for (let [a, b] of finishPoints){
    		let prevcell;
    		let distToValidCell = 0;
    		while(graph[a + "," + b].parent != graph[a + "," + b].index){
    			graph[a + "," + b].distToValidCell = ++distToValidCell;
    			prevcell = graph[a + "," + b];
    		}
    		result.push(prevcell);
    	}
    	result.sort(function (a, b){
    		return b.distToValidCell - a.distToValidCell;
    	});
    	return result;
    }

    canLead(card, cell, a, b){

    	if (a + 1 === cell.index[0]){
    		return (dirs(card).right === "yes");
    	}
    	if (a - 1 === cell.index[0]){
    		return (dirs(card).left === "yes")
    	}
    	if (b + 1 === cell.index[1]){
    		return (dirs(card).down === "yes")
    	}
    	if (b - 1 === cell.index[1]){
    		return (dirs(card).up === "yes")
    	}
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