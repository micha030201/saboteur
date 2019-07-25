let templates = [
	["yes", "yes", "yes", "yes", 4],
    ["yes", "no", "yes", "yes", 4],
    ["yes", "yes", "yes", "no", 2],
    ["no","dead","no","no", 1],
    ["yes", "yes", "no", "yes", 3],
	["yes", "no", "yes", "no", 2],
	["dead", "dead", "dead", "no", 1],
	["dead", "dead", "no", "no", 1],
	["no", "no", "yes", "yes", 3],
	["yes", "no", "no", "yes", 3],
	["yes", "yes", "no", "no", 4],
	["no", "yes", "no", "yes", 2],
	["no", "yes", "yes", "no", 3],
	["no", "yes", "yes", "yes", 1],
	["no", "dead", "dead", "no", 1],
	["dead", "no", "dead", "dead", 1],
	["no", "dead", "no", "dead", 1],
	["no", "no", "dead", "dead", 1],
	["no", "no", "dead", "no", 1],
	["dead", "dead", "dead", "dead", 1]
];
let deck = [];
let index = 0;
for(let template of templates){
	for (let j=0; j < template[4]; j++){
		deck[index++] = new PathCard(template[0], template[1], template[2], template[3]);
	}
}
