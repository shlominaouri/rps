
function vibrateSoldier(cell){
  $(cell.img).css('left',4);
  setTimeout(function() { $(cell.img).css('left',0); },200);
}

function getImage(soldier){
	var name = (soldier.player.id == 1) ? "MORTY" : "RICK";
	var type = soldier.type;
	var location = (soldier.player.id == whoAmI) ? "BACK" : "FRONT";
	var revealed = (soldier.player.id == whoAmI && soldier.revealed) ? "_R" : "";
	return "pics/" + name +"_" + type +"_" + location + revealed + ".png";
}

function refreshCell(cell) {
  if(cell.soldier != null ) {
    var soldier = cell.soldier;
		$(cell.img).show();
		$(cell.img).attr("src",getImage(soldier));
  } else {
		$(cell.img).hide();
	}
}
