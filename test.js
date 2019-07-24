function line_path () {

	for (let i = 0;i<7;i++){
		let card = new PathCard("no", "no", "yes","yes");
		let result = field.availableSpaces(card);
		let rightest = -1;
		for(let j = 0; j< result.length; j++){
			if (result[j][0] >= rightest){
				rightest = result[j][0];
			}
		}
		field.place(card,rightest, 0);
	}
}

function TestAcsess(){

	let card1 = new PathCard("no", "yes", "no", "no");
	let card2 = new PathCard("yes", "no", "no", "no");
	let card3 = new PathCard("no", "no", "yes", "no");
	let card4= new PathCard("no", "no", "no", "yes");
	field.place(card1, 0, -1);
	field.place(card2, 0, 1);
	field.place(card3, -1, 0);
	field.place(card4, 1, 0);	
	let result = field.availableSpaces(card1);
	if (result.length === 0){
		console.log("true");
	}
	else{
		console.log("false");
	}
}

function TestPipe(){

	let card1 = new PathCard("no", "yes", "no", "yes");
	let card2 = new PathCard("yes", "no", "no", "no");
	let card3 = new PathCard("yes", "no", "yes", "no");
	let card4= new PathCard("no", "no", "no", "yes");
	field.place(card1, 0, 1);
	field.place(card2, 0, -1);
	field.place(card3, 1, 0);
	field.place(card4, -1, 0);	
	let card = new PathCard ("no","yes", "yes","no");
	let result = field.availableSpaces(card);
	if (result[0][0] === 1 && result[0][1] === 1){
		console.log("true");
	}
	else{
		console.log("false");
	}
	let card_rev = new PathCard("yes", "no", "no", "yes");
	result = field.availableSpaces(card_rev);
	if (result[0][0] === 1 && result[0][1] === 1){
		console.log("true");
	}
	else{
		console.log("false");
	}
}

function TestInfinity(){
	let card = new PathCard("yes", "yes", "yes","yes",);
	let result = field.availableSpaces(card);
	for (let i = 0; i<1000; i++){
		field.place(card,result[0][0], result[0][1]);
		result = field.availableSpaces(card);
	}
}

function TestCanPlace(){
	field.grid[0][0]._right = "no";
	field.grid[0][0]._down = "no";
	let card1 = new PathCard("yes", "no", "no", "yes");
	let card2 = new PathCard("no", "yes", "no", "yes");
	field.place(card1 , -1, 0);
	field.place(card2, -1, 1);
	let arr = [new PathCard("no", "no", "yes", "yes"), new PathCard("yes", "no", "no", "yes"), new PathCard("yes", "yes", "no", "yes", )];
	let result;
	for (let i = 0; i<3;i++){
		result = field.availableSpaces(arr[i]);
		if (result.length == 0){
			console.log("pipe", arr[i] ,"can not be palced");
			if (i % 2 === 0){
				console.log("true");
			}
			else{
				if (i == 1){
					console.log("true")
				}
				else{
					console.log("false");
				}
			}			
		}
		else{
			console.log("pipe", arr[i] ,"can be palced");
			if (i % 2 === 1){
				console.log("true");
			}
			else{
				console.log("false");
			}			
		}
	}
}