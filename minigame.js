
var miniGame = null;

function MiniGame (from,to) {
  this.from = from;
  this.to = to;
  this.mySoldier = null;
  this.hisSoldier = null;
  this.hisReady = false;
  this.soldier = null;
}

function startMiniGame(from,to){
  console.log(startMiniGame);
  miniGame = new MiniGame(from,to);
  $("#minigame").show();
}

MiniGame.prototype.setMySoldier = function(soldier) {
  this.mySoldier = soldier;
}

MiniGame.prototype.setHisSoldier = function(soldier) {
  this.hisSoldier = soldier;
}

MiniGame.prototype.sendReadyCommand = function() {
  var command = {};
  command['type'] = "minigame";
  command['ready'] = true;
  var cmd =  JSON.stringify(command);
  console.log("send mini game command " + cmd);
  sendData(cmd);
}

MiniGame.prototype.sendCommand = function() {
  var command = {};
  command['type'] = "minigame";
  command['soldier'] = this.mySoldier;
  var cmd =  JSON.stringify(command);
  console.log("send mini game command " + cmd);
  sendData(cmd);
}

MiniGame.prototype.play = function() {
  console.log("playing mini game");
  $("#minigame").hide();
  if(this.from.soldier.player.id == whoAmI){
    this.from.soldier.type = this.mySoldier;
    this.to.soldier.type = this.hisSoldier;
  } else {
    this.to.soldier.type = this.mySoldier;
    this.from.soldier.type = this.hisSoldier;
  }
  refreshCell(this.from);
  refreshCell(this.to);
  this.from.moveSoldierTo(this.to);
}

MiniGame.prototype.handleCommand = function(cmd) {
  console.log("handl mini game command " + JSON.stringify(cmd));
  if (cmd['ready']) {
    this.hisReady = true;
    if(this.mySoldier)
      this.sendCommand();
  } else{
    this.hisSoldier = cmd['soldier'];
    if (this.mySoldier) {
      this.play();
    }
  }
}

function minigameClick(e) {
  var hand = $(e).attr("hand")
  miniGame.setMySoldier(hand);
  console.log("player chose " + hand);
  miniGame.sendReadyCommand();
  if(miniGame.hisReady){
    miniGame.sendCommand();
  }
  if(miniGame.hisSoldier){
    miniGame.play();
  } else {
    console.log("player didn't send his hand yet");
  }

}
