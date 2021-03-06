/*
    ***** BEGIN LICENSE BLOCK *****
    
    Copyright © 2011 Frank G. Bennett, Jr.
                     Faculty of Law, Nagoya University, Japan
                     http://twitter.com/#!/fgbjr
    
    This file is part of Item History for Zotero.
    
    Item History for Zotero is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    
    Item History for Zotero is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    
    You should have received a copy of the GNU Affero General Public License
    along with Zotero.  If not, see <http://www.gnu.org/licenses/>.
    
    ***** END LICENSE BLOCK *****
*/

/*global ZoteroItemHistory: true */

// Convenience mappings. Should have enabled/disabled branches.

ZoteroItemHistory.prototype.buttonNumberFromName = {
	"gohome": 0,
	"prev": 1,
	"next": 2
};


ZoteroItemHistory.prototype.buttonNameFromNumber = {
	"0": "gohome",
	"1": "prev",
	"2": "next"
};


ZoteroItemHistory.prototype.setButtonTooltip = function (button, name) {
			var stringName = "extensions.zotero-item-history." + this.buttonNameFromNumber[i];
	if (name === "gohome") {
		
	} else {
		
	}
};

ZoteroItemHistory.prototype.enableButton = function (name, enable) {
	if ("boolean" !== typeof enable) {
		throw "Second argument to enableButton() must be boolean true or false.";
	}
	var button = this.buttons[this.buttonNumberFromName[name]];
	button.setAttribute("disabled", !enable);
	var stub = "";
	if (!enable) {
		stub = "-disabled";
	}
	button.setAttribute("image", "chrome://zotero-item-history/skin/" + name + stub +".png");
	if (!enable) {
		this.buttons[this.buttonNumberFromName[name]].setAttribute("onclick", false);
	} else {
		switch (name) {
		case "prev": 
			this.setButtonAction("prev", button, "goPrev");
			break;
		case "next":
			this.setButtonAction("next", button, "goNext");
			break;
		default:
			break;
		}
	}
};

ZoteroItemHistory.prototype.setButtonAction = function (nick, button, functionName) {
	button.setAttribute("onclick", "ZoteroItemHistory." + functionName +"();");
};


ZoteroItemHistory.prototype.disableAllButtons = function () {
	var buttonNames = ["next", "prev"];
	for (var i = 0, ilen = buttonNames.length; i < ilen; i += 1) {
		var buttonName = buttonNames[i];
		this.enableButton(buttonName, false);
	}
};


ZoteroItemHistory.prototype.setButtonStates = function () {

	if ("undefined" === typeof this.LID) {
		this.disableAllButtons();
		for (var i = 0, ilen = this.menuitems.length; i < ilen; i += 1) {
			this.menuitems[i].setAttribute("disabled", "true");
		}
		return;
	} else {
		for (var i = 0, ilen = this.menuitems.length; i < ilen; i += 1) {
			this.menuitems[i].setAttribute("disabled", "false");
		}
	}

	var collectionLabel = this.document.getElementById("zotero-item-history-tooltiptext-gohome");
	collectionLabel.setAttribute("value", ZoteroItemHistory.collectionName);
	
	var historyLength;
	if ("undefined" !== typeof this.CID) {
		var historyLength = this.history[this.LID][this.CID].length;
	}
	if ("undefined" === typeof this.CID || historyLength === 0) {
		this.disableAllButtons();
	} else if (historyLength === 1) {
		this.enableButton("prev", true);
		this.enableButton("next", false);
	} else {
		if (this.index === -1) {
			this.enableButton("next", false);
			this.enableButton("prev", true);
		} else {
			if (this.index === historyLength - 1) {
				this.enableButton("next", false);
			} else {
				this.enableButton("next", true);
			}
			if (this.index === 0) {
				this.enableButton("prev", false);
			} else {
				this.enableButton("prev", true);
			}
		}
	}
};


ZoteroItemHistory.prototype.getSqlConditions = function (CID) {
	var sql;
	if (!CID) {
		CID = this.CID;
	}
	if (this.LID) {
		sql = "libraryID=? AND";
	} else {
		sql = "libraryID IS NULL AND";
	}
	if (CID) {
		sql += " collectionID=?";
	} else {
		sql += " collectionID IS NULL";
	}
	return sql;
};

ZoteroItemHistory.prototype.getSqlParams = function (CID) {
	if (!CID) {
		CID = this.CID;
	}
	var params = [];
	if (this.LID) {
		params.push(this.LID);
	}
	if (this.CID) {
		params.push(CID);
	}
	return params;
};

