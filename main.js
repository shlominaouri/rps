var cells = new Array();
var players = new Array();
var chosenCell = null;
var currentPlayer = null;

var p2p = true;
var p2pPlayer = null;
var images = new Array();

SoldierType = {
    BOMB : "BOMB",
    FLAG : "FLAG",
    SCISSORS : "SCISSORS",
    ROCK : "ROCK",
    PAPER : "PAPER",
}

var gameCommands = {
  moveSoldier: function(data){

  }
};

function getImage(soldier){
	var name = (soldier.player.id == 1) ? "MORTY" : "RICK";
	var type = (soldier.player == currentPlayer || soldier.revealed) ? soldier.type : "HIDE";
	var location = (soldier.player == currentPlayer) ? "BACK" : "FRONT";
	var revealed = (soldier.player == currentPlayer && soldier.revealed) ? "_R" : "";
	return "pics/" + name +"_" + type +"_" + location + revealed + ".png";
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

Cell.prototype.reveal = function () {
  if(this.soldier){
    this.soldier.revealed = 1;
    this.setSoldier(this.soldier);
  }
}

function iWin(type1,type2){
  return type1 == SoldierType.ROCK && type2 == SoldierType.SCISSORS
  || type1 == SoldierType.PAPER && type2 == SoldierType.ROCK
  || type1 == SoldierType.SCISSORS && type2 == SoldierType.PAPER
}

Cell.prototype.attack = function (otherCell) {
    var defender = otherCell.soldier;
    var attacker = this.soldier;
    if(attacker.type == defender.type) {
    } else if(defender.type == SoldierType.FLAG) {
      messageToScreen(attacker.player.name + " Won");
    } else if (defender.type == SoldierType.BOMB) {
      this.removeSoldier();
    } else if (iWin(this.type,defender.type)){ // WON FIGHT
      otherCell.removeSoldier();
    } else { // LOSE FIGHT
      this.removeSoldier();
    }
    otherCell.reveal();
    this.reveal();
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

Cell.prototype.refreshCell = function () {
  if(this.soldier != null ) {
    var soldier = this.soldier;
		$(this.img).show();
		$(this.img).attr("src",getImage(soldier));
  } else {
		$(this.img).hide();
	}
}

Cell.prototype.setSoldier = function (soldier) {
    this.soldier = soldier;
    this.refreshCell();
}

Cell.prototype.setElement = function (e,img) {
    this.element = e;
		this.img = img;
}

Cell.prototype.validMove = function (otherCell) {
  return ((Math.abs(this.row - otherCell.row) + Math.abs(this.col - otherCell.col) <= 1))
      && (this.row != otherCell.row || this.col != otherCell.col)

}

function handleData(data) {
  console.log("got data:" + data);
  var command = JSON.parse(data);
  var fromRow = command['from'][0]
  var fromCol = command['from'][1]
  var toRow = command['to'][0]
  var toCol = command['to'][1]

  var cellFrom = cells[7-fromRow][7-fromCol];
  var cellTo = cells[7-toRow][7-toCol];
  cellFrom.moveSoldierTo(cellTo)
}

function createCommand(type,from,to = null,soldier = null) {
  var command = {};
  command['type'] = type;
  command['from'] = [from.row,from.col];
  if(to)
    command['to'] = [to.row,to.col];
  if(soldier)
    command['soldier'] = soldier.type;
  return JSON.stringify(command);
}

Cell.prototype.moveSoldierTo = function (otherCell) {
  if(this.validMove(otherCell) == true){
      if(otherCell.soldier != null){
        if (p2p) sendData(createCommand("move",this,otherCell,this.soldier))
        this.attack(otherCell);
      } else {
        if (p2p) sendData(createCommand("move",this,otherCell))
        otherCell.setSoldier(this.soldier);
        this.removeSoldier();
      }
      setChosenCell(null);
      nextPlayer();
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
				cells[i][j].refreshCell()
		}
	}
}
function nextPlayer(){
  if(p2p){
    currentPlayer = players[(currentPlayer.id + 1) % 2];
  	rotateBoard();
  } else {

  }
	refreshAllCells();
}

function setChosenCell(cell){
  chosenCell = cell;
}

function messageToScreen(msg){
    alert(msg);
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

function placeSoldiers(){
  var player1 = players[0];
  var player1Stack = getStack();
  var player2 = players[1];
  var player2Stack = getStack();
  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 2; j++) {
      cells[j][i].setSoldier(new Soldier(player1,player1Stack.pop()));
    }
  }
  for (var i = 0; i < 8; i++) {
    for (var j = 7; j > 5; j--) {
      cells[j][i].setSoldier(new Soldier(player2,player2Stack.pop()));
    }
  }
}

function validSelectCell(cell) {
  var validSelect =  cell.soldier != null &&
    cell.soldier.player == currentPlayer &&
    cell.soldier.type != SoldierType.BOMB &&
    cell.soldier.type != SoldierType.FLAG
  var itsMyTurn = (!p2p || (p2p &&  cell.soldier.player == currentPlayer))
  return validSelect && itsMyTurn;
}

function clickCell(e){
  var thisCell = $(e).data("cell");
  if (chosenCell) {
    chosenCell.moveSoldierTo(thisCell);
  } else if(validSelectCell(thisCell)){
    setChosenCell(thisCell);
  }
}

function tableCreate() {
    var body = document.getElementsByTagName('body')[0];
    var board = document.createElement('div');
    board.id = "board";
    for (var i = 0; i < 8; i++) {
        var row = document.createElement('div');
        row.className  = "row";
        for (var j = 0; j < 8; j++) {
            var cell = document.createElement('div');
						var img = document.createElement('img');
						img.className = "soldier";
						cell.appendChild(img);
            cell.className = "cell";
            $(cell).data("cell",cells[i][j]);
						$(cell).attr("xy",i+"_" +j);
            cells[i][j].setElement(cell,img);
            cell.onclick = function() { clickCell(this); };
            row.appendChild(cell);
        }
        board.appendChild(row);
    }
    body.appendChild(board);
}
