//function to validate keyboard presses
function keyboardValidator(str) {
    return (str.length === 1 && str.match(/[a-z]/i)) || str == 'Backspace' || str == 'Back';
  }


//function to pad the times (seconds and minutes) with a leading zero if less than 10
function pad(n) {
    return (n < 10) ? ("0" + n) : n;
}

function padMilli(n) {
    let num;
    if(n < 10) {num = ("00" + n)};
    if(n >= 10 && n < 100) {num = ("0" + n)};
    if(n >= 100) {num = n};

    return num;
}


//function to check for orange or green letters
function colourLetters(enteredLetters, actualLetters){
    let remLetters = [...actualLetters];

    for(i=0; i<actualLetters.length; i++){
        entLet = enteredLetters[i];
        actLet = actualLetters[i];
        let keyboardKey = document.getElementById(entLet);

        if(entLet == actLet){
            squareGrid[wordIdx][i].style.backgroundColor = "LightGreen";
            keyboardKey.style.backgroundColor = "LightGreen";
            remLetters[i] = null;
            enteredLetters[i] = null;
        } 
    }

    for(i=0; i<remLetters.length; i++){
        entLet = enteredLetters[i];
        actLet = actualLetters[i];

        if (entLet != null){
            let keyboardKey = document.getElementById(entLet);

            if (remLetters.includes(entLet)){
                squareGrid[wordIdx][i].style.backgroundColor = "orange";
                keyboardKey.style.backgroundColor = "orange";

            } else {
                squareGrid[wordIdx][i].style.backgroundColor = "DarkGrey";
                if(!(keyboardKey.style.backgroundColor == "lightgreen" || keyboardKey.style.backgroundColor == "orange")){
                    keyboardKey.style.backgroundColor = "DarkGrey";
                }
            }
        }
    }
}


//the WORDLE word
let numWords = wordleWordsList.length;
randomNumber = Math.floor((Math.random()*numWords) + 1);

//"wordleWordsList" comes from worldeWords.js
const wordleWord = wordleWordsList[randomNumber].toUpperCase();
console.log(randomNumber, wordleWord);
const wordleLetters = wordleWord.split("");


//generates the required 30 squares and stores them in the 'square_container' div
let output = "";
for(i = 0; i<30; i++){
    output += "<div class='square'></div>";
    }
document.getElementById('square_container').innerHTML = output;


//generates virtual keyboard
const keyList = [['Q','W','E','R','T','Y','U','I','O','P','Back'],
                ['A','S','D','F','G','H','J','K','L','Enter'],
                ['Z','X','C','V','B','N','M']];
let keyHTML = [[], [], []];

for(i=0; i<keyList.length; i++){
    for(z=0; z<keyList[i].length; z++){
        keyHTML[i].push("<input class='key' id='" + keyList[i][z] + "' type='button' value='" + keyList[i][z] + "' onclick='logKey(this.id)' />");
        }
    //keyHTML[i].join("")
}

document.getElementById('vkRow1').innerHTML = keyHTML[0].join("");
document.getElementById('vkRow2').innerHTML = keyHTML[1].join("");
document.getElementById('vkRow3').innerHTML = keyHTML[2].join("");


//sorts all squares/div objects into a 3d array called squareGrid
const square = document.getElementsByClassName('square');
let squaresArray = [];
let squareGrid = [[], [], [], [], [], []];

for(y=0; y<square.length; y++){squaresArray.push(square.item(y))}
for(j=0; j<6; j++){squareGrid[j] = squaresArray.splice(0,5)}


//listen for keydown event - if it occurs then call function logKey
document.addEventListener('keydown', logKey);

var idx = 0; //idx of which square to enter or delete letter from
var wordIdx = 0; //idx of which word i.e. row the user is working on
var letterTyped = false;


//function to enter or delete the entered letters at the current position, and then change grid position to previous or next
function logKey(e) {
    if(typeof e == "string"){keyPressed = e;} else {keyPressed = e.key;}

    if(keyboardValidator(keyPressed)){
        if(letterTyped == false){
            start();
            letterTyped = true;
            }

        if(keyPressed == 'Backspace' || keyPressed == 'Back') {
            if(idx > 0){
                idx -= 1;
                }
            squareGrid[wordIdx][idx].textContent = "";

        } else {
            if(idx < 5){
                squareGrid[wordIdx][idx].textContent = keyPressed.toUpperCase();
                idx += 1;
                }
            }
        }

    if(keyPressed == 'Enter'){
        wordEntryFunction()
        }
}


//function to pass game data to python backend
function passGameData(time, word, guesses) {
    const gameInfo = {'time': time, 'word': word, 'guesses': guesses};
    console.log("game info", gameInfo);
    $.ajax({
    url: '/submitGameInfo',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(gameInfo),
    })
    .done(function(result){
        console.log(result)
    })
}


//function called when user clicks Entry button
function wordEntryFunction() {
    //obtaining the entered word from the row of div squares and storing in tempWord
    let tempLetters = [];
    for(let i=0; i<5; i++){
        tempLetters.push(squareGrid[wordIdx][i].textContent);
    }
    let tempWord = tempLetters.join("");

    if(tempWord.length == 5){
        if(allowedGuessesList.includes(tempWord)){
        colourLetters(tempLetters, wordleLetters);

        //if tempWord = wordleWord then game is won
        if(tempWord == wordleWord){
            clearInterval(timerInterval);

            var completionTime = pad(minutesPassed).toString() + ":" + pad(secondsPassed).toString() + ":" + padMilli(elapsedTime).toString();
            let numGuesses = wordIdx + 1;
            passGameData(completionTime, wordleWord, numGuesses);

            alert("YOU HAVE GUESSED THE WORD\nYOUR TIME WAS " + completionTime + "\nYOU USED " + numGuesses + " GUESSES");
            return
            }

        //if not on last row, add 1 to row index and reset column index to start again at the next row
        if(wordIdx < 6){
            wordIdx += 1;
            idx = 0;
            }

        //if 6 guesses have been ussed then game has been lost
        if(wordIdx == 6){
            clearInterval(timerInterval);

            let numGuesses = wordIdx + 1;
            let completionTime = null;
            passGameData(completionTime, wordleWord, numGuesses);

            alert("GAME OVER. The word was " + wordleWord)
            }

    //if the player has guessed a non-word
    } else {alert("NOT A WORD")}

// if the user presses enter before entering a 5-letter word
} else {alert("WORD MUST BE 5 LETTERS")}
}


//function to start the timer upon page load
let startTime;
let elapsedTime = 0;
let secondsPassed = 0;
let minutesPassed = 0;
let timerInterval;

//function printTime is repeated at setInterval of x (currently 1 ms)
function start() {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(function printTime() {

    elapsedTime = Date.now() - startTime;

    if(elapsedTime >= 1000){
        secondsPassed += 1;
        document.getElementById("mainsecond").textContent=pad(secondsPassed)

        startTime = Date.now();
    }

    if(secondsPassed == 60){
        minutesPassed += 1;
        secondsPassed = 0;

        document.getElementById("mainsecond").textContent="0" + secondsPassed.toString();
        document.getElementById("mainminute").textContent=pad(minutesPassed);

        startTime = Date.now();
    }

    //if(elapsedTime >= 100 && elapsedTime < 1000){document.getElementById("milliseconds").textContent=elapsedTime;}
    document.getElementById("milliseconds").textContent=padMilli(elapsedTime);

    }, 1);
}
