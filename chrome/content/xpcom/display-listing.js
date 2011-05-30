/*
    ***** BEGIN LICENSE BLOCK *****
    
    Copyright © 2011 Frank G. Bennett, Jr.
                     Faculty of Law, Nagoya University, Japan
                     http://twitter.com/#!/fgbjr
    
    This file is part of Zotero Item History.
    
    Zotero Item History is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    
    Zotero Item History is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    
    You should have received a copy of the GNU Affero General Public License
    along with Zotero.  If not, see <http://www.gnu.org/licenses/>.
    
    ***** END LICENSE BLOCK *****
*/

/*global ZoteroItemHistory: true */

ZoteroItemHistory.prototype.getVolIssueJournal = function (item) {
	var Zotero = this.Zotero;
	var fieldID;
	fieldID = this.Zotero.ItemFields.getFieldIDFromTypeAndBase(item.itemTypeID, 'volume');
	var itemVol = item.getField(fieldID);
	
	fieldID = this.Zotero.ItemFields.getFieldIDFromTypeAndBase(item.itemTypeID, 'issue');
	var itemIssue = item.getField(fieldID);
	
	if (!itemIssue) {
		var extra = item.getField('extra');
		var m = extra.match(/\{:issue:\s*([^\}]*)\}/);
		if (m) {
			itemIssue = m[1];
		}
	}
	var volIssue = [];
	if (itemVol) {
		volIssue.push(itemVol);
	}
	if (itemIssue) {
		volIssue.push(itemIssue);
	}
	volIssue = volIssue.join(":");
	var volIssueJournal = [];
	if (volIssue) {
		volIssueJournal.push(volIssue);
	}
	// Journal name, short if poss.
	var journalName = false;
	if (item.getField('journalAbbreviation')) {
		journalName = item.getField('journalAbbreviation');
	}
	if (!journalName) {
		fieldID = this.Zotero.ItemFields.getFieldIDFromTypeAndBase(item.itemTypeID, 'publicationTitle');
		journalName = item.getField(fieldID);
	}
	if (!journalName) {
		journalName = item.getField('reporter');
	}
	if (!journalName) {
		journalName = item.getField('code');
	}
	if (journalName) {
		volIssueJournal.push(journalName);
	}
	return volIssueJournal.join(" ");
};


ZoteroItemHistory.prototype.getYear = function (item) {
	var Zotero = this.Zotero;
	var fieldID = this.Zotero.ItemFields.getFieldIDFromTypeAndBase(item.itemTypeID, 'date');
	return item.getField(fieldID, false);
};


ZoteroItemHistory.prototype.buildItemMenu = function (menu, itemID) {
	var slots, itemSlots, i, ilen, j, jlen, k, klen;
	var Zotero = this.Zotero;

	var document = menu.ownerDocument;
	var item = this.Zotero.Items.get(itemID);

	var itemAuthors = item.getField('firstCreator');
	if (!itemAuthors) {
		itemAuthors = "";
	}
	var itemTitle = item.getDisplayTitle();
	if (!itemTitle) {
		itemTitle = "";
	}
	
	// Get currently selected item.
	
	// Make a version of the list that does not contain the currently selected itemID.
	var allitems = this.history[this.LID][this.CID].slice();
	var related = [];
	for (i = allitems.length - 1; i > -1; i += -1) {
		if (allitems[i] != itemID) {
			related.push(allitems[i]);
		}
	}
	related = this.Zotero.Items.get(related);
	allitems = related.concat([item]);
	// Gather all item data
	var data = [];
	var datum;
	var keys = ["author", "title", "volIssueJournal", "year"];
	var key;
	for (i = 0, ilen = allitems.length; i < ilen; i += 1) {
		datum = {};
		datum.author = allitems[i].getField('firstCreator');
		datum.title = allitems[i].getDisplayTitle();
		datum.volIssueJournal = this.getVolIssueJournal(allitems[i]);
		datum.year = this.getYear(allitems[i]);
		for (j = 0, jlen = 4; j < jlen; j += 1) {
			key = keys[j];
			if (!datum[key]) {
				datum[key] = '';
			} else {
				datum.last = j;
			}
		}
		for (j = datum.last - 1; j > 0; j += -1) {
			key = keys[j];
			if (datum[key]) {
				datum.penultimate = j;
				break;
			}
		}
		data.push(datum);
	}
	
	// Data is one-to-one aligned with allitems, with the current
	// selection at the end. Use it to generate a second one-to-one
	// aligned array of disambiguated string pairs for each item in
	// allitems, less the current selection.
	var relatedInfo = [];
	for (i = 0, ilen = data.length - 1; i < ilen; i += 1) {
		var info = [];
		if (data[i].author && data[i].author.slice(0, 15) !== data[data.length - 1].author.slice(0, 15)) {
			info.push(data[i].author);
		}
		for (j = 1, jlen = 4; j < jlen; j += 1) {
			key = keys[j];
			if (j === data[i].last) {
				if (info.length === 0) {
					if ("undefined" === typeof data[i].penultimate) {
						info.push("");
					} else {
						info.push(data[i][keys[data[i].penultimate]]);
					}
				}
				info.push(data[i][keys[data[i].last]]);
				break;
			} else {
				var useme = true;
				for (k = 0, klen = data.length; k < klen; k += 1) {
					if (i === k) {
						continue;
					}
					if (data[i][key].slice(0, 15) === data[k][key].slice(0, 15)) {
						useme = false;
					}
				}
				if (useme) {
					info.push(data[i][key]);
				}
				if (info.length === 2) {
					break;
				}
			}
		}
		if (info.length === 0) {
			info.push("");
			info.push("(no data)");
		}
		relatedInfo.push(info);
	}
	
	// menu is our storage target
	for (i = 0, ilen = relatedInfo.length; i < ilen; i += 1) {
		var menuitem = document.createElement("menuitem");
		var targetID = allitems[i].id;
		menuitem.setAttribute("id", "zotero-item-history-item-" + targetID);
		var hbox = document.createElement("hbox");
		hbox.setAttribute("width", "300");
		hbox.setAttribute("maxwidth", "300");
		for (j = 0, jlen = relatedInfo[i].length; j < jlen; j += 1) {
			var label = document.createElement("label");
			label.setAttribute('value', relatedInfo[i][j]);
			label.setAttribute('crop','end');
			if (j === 1) {
				label.setAttribute('flex', 1);
				label.setAttribute("style", "text-align:left;");
			} else {
				label.setAttribute("style", "min-width:50;text-align:right;");
				label.setAttribute("maxwidth", "100");
				label.setAttribute('crop','end');
			}
			hbox.appendChild(label);
		}
		menuitem.appendChild(hbox);
		menuitem.setAttribute("context", "zotero-item-history-context");
		menuitem.setAttribute("oncommand", "ZoteroItemHistory.goTo(this);");
		menu.appendChild(menuitem);
	}
};
