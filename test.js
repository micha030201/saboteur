function testAll(){
    return("line: " + testLine() + "\n" +
        "Acsess: " + testAcsess() + "\n" +
        "Pipe: " + testPipe() + "\n" +
        "dead end check: " + testReacheable() + "\n" +
        "gap test: " + testGap() + "\n" +
        "Bordercheck: " + testBorderCheck() + "\n");
}

function testLine () {

    let testField = new Field();
    testField.grid[0][0] = 0;
    let checkString = "";
    for (let i = 0;i<7;i++){
        let card = 21;
        let result = testField.availableSpaces(card);
        let rightest = -1;
        for(let j = 0; j< result.length; j++){
            if (result[j][0] >= rightest){
                rightest = result[j][0];
            }
        }
        testField.place(card,rightest, 0);
        checkString += rightest;
    }
    return (checkString === "1234567");
}

function testAcsess(){

    let testField = new Field();
    let card1 = 41;
    let card2 = 42;
    let card3 = 20;
    let card4= 19;
    testField.place(card1, 0, -1);
    testField.place(card2, 0, 1);
    testField.place(card3, -1, 0);
    testField.place(card4, 1, 0);
    let result;
    let card;
    let returnVal = true;
    for (let i = 0; i< 40 ; i++) {
        card = i;
        result  = testField.availableSpaces(card);
        if (result.length !== 0){
            returnVal = false;
        }
    }
    return returnVal;
}

function testPipe(){

    let testField = new Field();
    let card1 = 31;
    testField.place(card1, 0, -1);
    let [a, b] = testField.canPlaceInPosition(31, 1, -1);
    let [c, d] = testField.canPlaceInPosition(24, 1, -1);
    return  (a  === false && b === true &&
        c === false && d === true);
}

function testReacheable(){

    let testField = new Field();
    let card = 11;
    testField.place(card, 0, -1);
    let card1 = 19;
    testField.place(card1, 1, 0);
    let card2 = 38;
    testField.place(card2, -1, 0);
    let card3 = 42;
    testField.place(card3, 0, 1);
    return (testField.reachableSpaces.length == 0);
}

function testGap(){

    let testField = new Field();
    testField.grid[0][0] = 0;
    let card = 28;
    testField.place(card, 0, - 2);
    let testData = [28, 21, 41];
    let res = (gap(testField, testData, [0, -1]));

    testField.grid[0][0] = 0;
    card = 21;
    testField.place(card, 2, 0);
    testData = [21, 28, 41];
    return (gap(testField, testData, [1, 0]) && res);

}

function gap(testField, arr, answer){

    let result;
    let answ;
    for (let i = 0; i<3;i++){
        result = testField.availableSpaces(arr[i]);
        for (let [a, b] of result){
            if (a === answer[0] && b === answer[1] && i === 0){
                answ = true;
            }
             if (a === answer[0] && b === answer[1] && i !== 0){
                answ = false;
            }
        }
    }
    return answ;
}

function testBorderCheck(){
    let card = 0;
    let testField = new Field();
    for (let i = 1; i < 4; i++) {
        testField.place(card, 0,i);
    }
    for (let i = -2; i <=10; i++) {
        testField.place(card, i, 3);
        testField.place(card, i,-3);
    }
    for (let i = -3; i <= 3; i++) {
        testField.place(card, -2, i);
        testField.place(card, 10, i)
    }
    let cards = [0, 42, 21, 28, 25, 34];
    for (let l of cards){
        let result = testField.availableSpaces(l);
        for (let [a, b] of result){
            if (Math.abs(b) > 3 || a < -2 || a > 10){
                return ("false" + l + a + b);
            }
         }
    }
    return true;
}