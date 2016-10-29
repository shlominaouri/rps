var cells = new Array();
var players = new Array();
var chosenCell = null;
var currentPlayer = null;
var whoAmI = 1;

var p2p = true;
var p2pPlayer = null;
var images = new Array();

Players = {
    RICK : 0,
    MORTY : 1,
}

SoldierType = {
    BOMB : "BOMB",
    FLAG : "FLAG",
    SCISSORS : "SCISSORS",
    ROCK : "ROCK",
    HIDE : "HIDE",
    PAPER : "PAPER",
}

function Player(id,name){
  this.id =  id
  this.name =  name
};

function Soldier(player1,type1){
  this.player =  player1
  this.type =  type1
  this.revealed = 0;
};

Cell.prototype.reveal = function (type) {
  if(this.soldier){
    console.log("revealing " + this.row + " " + this.col + " " + type);
    if(type){
      this.soldier.type = type;
    }
    this.soldier.revealed = 1;
    this.setSoldier(this.soldier);
  }
}

function iWin(type1,type2){
  return type1 == SoldierType.ROCK && type2 == SoldierType.SCISSORS
  || type1 == SoldierType.PAPER && type2 == SoldierType.ROCK
  || type1 == SoldierType.SCISSORS && type2 == SoldierType.PAPER
  || type1 == SoldierType.BOMB
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


Cell.prototype.attack = function (otherCell) {
    var fromCell = this;
    var toCell = otherCell;
    var defender = otherCell.soldier;
    var attacker = this.soldier;
    var thisCell = this;
    otherCell.reveal();
    this.reveal();
    var iAmTheAttacker = thisCell.soldier.player.id == whoAmI;
    setTimeout(function(){
      console.log("defender " + defender.type + " attacker " + attacker.type );
      if(attacker.type == defender.type) {
        console.log("TIE");
        startMiniGame(fromCell,toCell);
        nextPlayer();
      } else if(defender.type == SoldierType.FLAG) {
        if(iAmTheAttacker){
          messageToScreen("Great Battale, you won!");
        } else {
          messageToScreen("You lose again");
        }
      } else if (defender.type == SoldierType.BOMB ||
                attacker.type == SoldierType.BOMB) {
        console.log("bomb removing this " + this.row + "-" + this.col);
        thisCell.removeSoldier();
        console.log("removing bomb " +  otherCell.row + "-" + otherCell.col);
        otherCell.removeSoldier();
        nextPlayer();
      } else if (iWin(attacker.type,defender.type)){ // WON FIGHT
        console.log("attacker wins");
        otherCell.removeSoldier();
        atomicMoveSolider(thisCell,otherCell);
        setChosenCell(null);
        if(iAmTheAttacker){
          messageToScreen("Great move, you have another turn");
        } else {
          messageToScreen("ohhh too bad");
        }
      } else { // LOSE FIGHT
        console.log("attacker lose");
        thisCell.removeSoldier();
        nextPlayer();
      }
    }, 1000);

}

function rotateBoard(){
  rotateBoard180();
}

function rotateBoard180(){
	var soldiersCopy = new Array();
	for (var i = 0; i < 8; i++) {
		soldiersCopy[i] = new Array();
		for (var j = 0; j < 8; j++) {
				soldiersCopy[i][j] = cells[i][j].soldier;
		}
	}

	for (var i = 0; i < 8; i++) {
		for (var j = 0; j < 8; j++) {
				cells[i][j].soldier = soldiersCopy[7-i][7-j];
		}
	}
  refreshAllCells();
}

function Cell(row,column){
  this.soldier= null
  this.row =  row
  this.col = column
};

Cell.prototype.removeSoldier = function () {
    this.soldier = null;
    //this.element.innerHTML = null;
		$(this.img).removeAttr("src");
		$(this.img).hide();
}

Cell.prototype.setSoldier = function (soldier) {
    this.soldier = soldier;
    refreshCell(this);
}

Cell.prototype.setElement = function (e,img,background) {
    this.element = e;
		this.img = img;
    this.background = background;
}

function validDiagonal(fromCell,toCell,distance){
  var rowDiff = toCell.row - fromCell.row
  var colDiff = toCell.col - fromCell.col
  var middleCellRow = fromCell.row + Math.sign(rowDiff)
  var middleCellCol = fromCell.col + Math.sign(colDiff)
  var middleCell = cells[middleCellRow][middleCellCol]
  return middleCell.soldier==null &&
        (Math.abs(rowDiff) == Math.abs(colDiff)) &&
        Math.abs(rowDiff) <= distance;
}

function validLong(fromCell,toCell,distance){
  var rowDiff = toCell.row - fromCell.row
  var colDiff = toCell.col - fromCell.col
  var middleCellRow = fromCell.row + Math.sign(rowDiff)
  var middleCellCol = fromCell.col + Math.sign(colDiff)
  var middleCell = cells[middleCellRow][middleCellCol]
  return middleCell.soldier==null &&
        (Math.abs(rowDiff) + Math.abs(colDiff) <= distance)
}

Cell.prototype.validMove = function (otherCell) {
  var simpleMove = ((Math.abs(this.row - otherCell.row) + Math.abs(this.col - otherCell.col) == 1));
  var longMove = validLong(this,otherCell,2);
  var diagonal = validDiagonal(this,otherCell,2);

  var samePlace = this == otherCell;
  return (simpleMove || longMove || diagonal) && !samePlace;
}

Cell.prototype.validChangeSoldier = function (otherCell) {
  return whoAmI == otherCell.soldier.player &&
      whoAmI == currentPlayer.id;
}

function handleData(data) {
  console.log("got data:" + data);
  var command = JSON.parse(data);
  if(command['type']=="minigame"){
    miniGame.handleCommand(command);
  } else if (command['type']== "mouseOver"){
    if(command['show']){
      console.log("adding class mouse over");
      $(cells[command['row'],command['col']]).addClass("mouseOver");
    } else {
      $(cells[command['row'],command['col']]).removeClass("mouseOver");
    }
  } else {
    var fromRow = command['from'][0]
    var fromCol = command['from'][1]
    var toRow = command['to'][0]
    var toCol = command['to'][1]
    var cellFrom = cells[7-fromRow][7-fromCol];
    var cellTo = cells[7-toRow][7-toCol];
    if (command['type'] == "revealAndMove") {
      if (command['fromSoldier']) {
        cellFrom.reveal(command['fromSoldier']);
      }
      if (command['toSoldier']) {
        cellTo.reveal(command['toSoldier']);
      }
      if(!command['final']){
        sendData(createMoveCommand('revealAndMove',cellFrom,cellTo,true,true));
      }
      cellFrom.moveSoldierTo(cellTo);
    } else {
      cellFrom.moveSoldierTo(cellTo)
    }
  }
}

function createMoveCommand(type,from,to = null,reveal = false,final = false) {
  var command = {};
  command['type'] = type;
  command['from'] = [from.row,from.col];
  command['to'] = to ? [to.row,to.col]: false;
  command['fromSoldier'] = (reveal && from.soldier.type != 'HIDE') ? from.soldier.type: false;
  command['toSoldier'] = (to && reveal && to.soldier.type != 'HIDE') ? to.soldier.type: false;
  command['final'] = final;
  return JSON.stringify(command);
}

function atomicMoveSolider(from,to){
  to.setSoldier(from.soldier);
  from.removeSoldier();
}

function markMovedCell (cell) {
  $(cell.background).addClass("movedCell");
  setTimeout(function() { $(cell.background).removeClass("movedCell"); },2000);
}

Cell.prototype.moveSoldierTo = function (otherCell) {
  if(this.validMove(otherCell) == true){
      if(whoAmI != this.soldier.player.id){
        markMovedCell(this);
        markMovedCell(otherCell);
      }
      console.log("valid move");
      if(otherCell.soldier != null){
        this.attack(otherCell);
      } else {
        atomicMoveSolider(this,otherCell);
        nextPlayer();
      }
  }
}

function initPlayers(){
  for (var i =0 ;i <2 ; i++){
    players[i] = new Player(i,"Player_" +i);
  }
}

function initCells(){
  for (var i = 0; i < 8; i++) {
    cells[i] = new Array()
    for (var j = 0; j < 8; j++) {
      cells[i][j] = new Cell(i,j);
    }
  }
}

function refreshAllCells(){
	for (var i = 0; i < 8; i++) {
		for (var j = 0; j < 8; j++) {
				refreshCell(cells[i][j])
		}
	}
}
function nextPlayer(){
  if(p2p){
    currentPlayer = players[(currentPlayer.id + 1) % 2];
  	//rotateBoard();
  }
  if (currentPlayer.id == whoAmI) {
    messageToScreen("Your turn now");
  }
  setChosenCell(null);
	refreshAllCells();
}

function setChosenCell(cell){
  if(chosenCell)
    $(chosenCell.background).removeClass("chosenCell");
  chosenCell = cell;
  if(cell)
    $(cell.background).addClass("chosenCell");
}

function messageToScreen(msg){
  $("#message").show();
  $("#messages_text").text(msg);
  setTimeout(function(){$("#message").hide()},5000);
}

function addSoldiersToStack(stack,type,amount) {
  for (var i = 0; i < amount; i++) {
    stack.push(type);
  }
}
function getStack(){
  var stack = new Array();
  addSoldiersToStack(stack,SoldierType.ROCK,4)
  addSoldiersToStack(stack,SoldierType.PAPER,4)
  addSoldiersToStack(stack,SoldierType.SCISSORS,4)
  addSoldiersToStack(stack,SoldierType.FLAG,1)
  addSoldiersToStack(stack,SoldierType.BOMB,3)
  shuffle(stack);
  return stack;
}

function cellMosueOut (){
  var thisCell = $(this).data("cell");
  var command = { }
  command['type'] = "mouseOver";
  command['show'] = false;
  command['row'] = thisCell.row;
  command['col'] = thisCell.col;
  ///sendData(JSON.stringify(command)); TODO
}

function cellMosueOver (){
  var thisCell = $(this).data("cell");
  var command = { }
  command['type'] = "mouseOver";
  command['show'] = true;
  command['row'] = this.row;
  command['col'] = this.col;
  //sendData(JSON.stringify(command)); TODO
}

function eachback(a){
    $(a).mouseover(m2);
}

$( ".backgroundCell" ).each(eachback)

function shuffle (array) {
  var i = 0
    , j = 0
    , temp = null

  for (i = array.length - 1; i > 0; i -= 1) {
    j = Math.floor(Math.random() * (i + 1))
    temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

function getOpponentPlayer(){
  return players[(whoAmI + 1) % 2]
}

function placeSoldiers(){
  var player = players[whoAmI];
  var opponent = getOpponentPlayer()
  var myStack = getStack();

  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 2; j++) {
      cells[j][i].setSoldier(new Soldier(opponent,"HIDE"));
    }
  }
  for (var i = 0; i < 8; i++) {
    for (var j = 7; j > 5; j--) {
      cells[j][i].setSoldier(new Soldier(player,myStack.pop()));
    }
  }
}

function validSelectCell(cell) {
  var validSelect = cell.soldier != null &&
    cell.soldier.player == currentPlayer &&
    currentPlayer.id == whoAmI &&
  //  cell.soldier.type != SoldierType.BOMB &&
    cell.soldier.type != SoldierType.FLAG &&
    cell.soldier.player == currentPlayer;
  if(validSelect)
    console.log("cell was selected");
  else {
    console.log("invalid cell");
    vibrateSoldier(cell);
  }
  return validSelect;
}

function moveSoldier(fromCell,toCell){
  sendData(createMoveCommand("move",fromCell,toCell,false))
  fromCell.moveSoldierTo(toCell);
}

function clickCell(e){
  var thisCell = $(e).data("cell");
  if (chosenCell) {
    if(thisCell.soldier && thisCell.soldier.player.id == whoAmI) { //change soldier
      setChosenCell(thisCell);
    } else if(chosenCell.validMove(thisCell)){ //move soldier
      if (thisCell.soldier) { // move and attack
          sendData(createMoveCommand("revealAndMove",chosenCell,thisCell,true))
      } else {  // just move
        moveSoldier(chosenCell,thisCell);
      }
    } else{
      console.log("invalid move");
    }
  } else if(validSelectCell(thisCell)){
    setChosenCell(thisCell);
  }
}

function tableCreate() {
  var body = document.getElementById('main');
  var board = document.createElement('div');
  board.id = "board";
  for (var i = 0; i < 8; i++) {
      var row = document.createElement('div');
      row.className  = "row";
      for (var j = 0; j < 8; j++) {
          var cell = document.createElement('div');
          var cellBackground = document.createElement('div');
          $(cell).mouseover(cellMosueOver);
          $(cell).mouseout(cellMosueOut);
					var img = document.createElement('img');
          cellBackground.className = "backgroundCell";
					img.className = "soldier";
          cell.appendChild(cellBackground);
					cell.appendChild(img);
          cell.className = "cell";
          $(cell).data("cell",cells[i][j]);
					$(cell).attr("xy",i+"_" +j);
          cells[i][j].setElement(cell,img,cellBackground);
          cell.onclick = function() { clickCell(this); };
          row.appendChild(cell);
      }
      board.appendChild(row);
  }
  body.appendChild(board);
}
