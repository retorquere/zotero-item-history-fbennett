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

ZoteroItemHistory.prototype.goNext = function () {
	// Select and view next item
	var history = this.history[this.LID][this.CID];
	if (this.index < history.length - 1) {
		this.index += 1;
	}
	this.showInCollection();
};


ZoteroItemHistory.prototype.goPrev = function () {
	dump("YYY Running goPrev()\n");
	try{
	// Select and view previous item
	var history = this.history[this.LID][this.CID];
	if (this.index > 0) {
		this.index += -1;
	} else if (this.index === -1) {
		this.index = history.length - 1;
	}
	this.showInCollection();
	} catch (e) {
		dump("YYY ZoteroItemHistory: [goPrev]" + e + "\n");
	}
};

ZoteroItemHistory.prototype.goTo = function (menunode) {
	var itemID = menunode.getAttribute("id");
	itemID = itemID.replace("zotero-item-history-item-", "");
	var history = this.history[this.LID][this.CID];
	this.index = history.indexOf("" + itemID);
	this.showInCollection();
};

ZoteroItemHistory.prototype.showInCollection = function () {
	try {
	var history = this.history[this.LID][this.CID];
	var cTree = this.ZoteroPane_Local.collectionsView;
	var itemID = parseInt(history[this.index], 10);
	// If a single id is argument, Zotero.Items.get() returns the object
	// directly.
	var item = this.Zotero.Items.get([itemID]);
	// ... but that doesn't seem to be the case.
	if (item.length) {
		item = item[0];
	}
	// dump("YYY libraryID=" + this.LID + ", collectionID=" + this.CID + ", itemID=" + itemID + "\n");

	var isSearch = false;

	var iTree = this.ZoteroPane_Local.itemsView;
	if (this.CID) {
		var type = this.CID.slice(0, 1);
		var cID = parseInt(this.CID.slice(1), 10);
		if ("C" === type) {
			// Collection
			var currentCollection = cTree.getSelectedCollection(true);
			if (currentCollection !== cID && item.inCollection(cID)) {
				cTree.rememberSelection(this.CID);
				iTree = this.ZoteroPane_Local.itemsView;
			} else if (currentCollection === cID && !item.inCollection(cID)) {
				cTree.selectLibrary(this.LID);
				iTree = this.ZoteroPane_Local.itemsView;
			}
		} else {
			// Saved search
			var currentLocationId = cTree.saveSelection();
			var currentType = currentLocationId.slice(0, 1);
			var hasItem;
			if (currentType === "S") {
				hasItem = iTree.selectItem(itemID);
				//dump("YYY   hasItem[1]="+hasItem+", for itemID=" + itemID + "title: " + item.getField("title") + "\n");
				if (!hasItem) {
					// Try Library or group
					cTree.selectLibrary(this.LID);
					iTree = this.ZoteroPane_Local.itemsView;
					iTree._treebox.invalidate();
				}
			} else {
				// Return to search?
				cTree.rememberSelection(this.CID);
				iTree = this.ZoteroPane_Local.itemsView;
				iTree.refresh();
				hasItem = iTree.selectItem(itemID);
				// dump("YYY   hasItem[2]="+hasItem+", for itemID=" + itemID + ", title: " + item.getField("title") + "\n");
				if (!hasItem) {
					// Back to Library or group
					cTree.selectLibrary(this.LID);
					iTree = this.ZoteroPane_Local.itemsView;
					iTree._treebox.invalidate();
				}
			}
		}
	}
	cTree._treebox.focused = false;
	iTree._treebox.focused = true;
	iTree.selectItem(itemID);
	this.setButtonStates();
	} catch (e) {
		this.Zotero.debug("ZoteroItemHistory [showInCollection]: " + e);
	}
};

ZoteroItemHistory.prototype.buildHome = function (menu) {
	for (var i = menu.childNodes.length - 1; i > -1; i += -1) {
		menu.removeChild(menu.childNodes.item(i));
	}
	var iTree = this.ZoteroPane_Local.itemsView;
	var iTreeItems = iTree.getSelectedItems(true);
	if (iTreeItems && iTreeItems.length) {
		var itemID = iTreeItems[0];
		this.buildItemMenu(menu, itemID);
	}
};


ZoteroItemHistory.prototype.removeEntry = function () {
	// Remember the current itemID
	var itemID = this.history[this.LID][this.CID][this.index];

	// Remove entry in SQL and refresh list.
	var menuitem = this.document.popupNode;
	var targetID = menuitem.getAttribute("id");
	targetID = targetID.replace("zotero-item-history-item-", "");
	targetID = parseInt(targetID, 10);
	var sql = "DELETE FROM steps WHERE " + this.getSqlConditions();
	var params = this.getSqlParams();
	sql += " AND itemID=?";
	params.push(targetID);
	this.db.query(sql, params);
	this.history[this.LID][this.CID] = undefined;
	this.initHistoryOk();
	// Reset index pointer
	this.index = this.history[this.LID][this.CID].indexOf("" + itemID);
	// Reset buttons (in case the list now has only one remaining member or is empty)
	this.setButtonStates();
};


ZoteroItemHistory.prototype.selectAll = function (ZoteroPane_Local) {
	var history = this.history[ZoteroItemHistory.LID][ZoteroItemHistory.CID];
	// Determine if all items are available in the current collection (?)
	var localOk = true;

	// XXXXX Not quite good enough. "Collection" could be either
	// a collection or a saved search. But this can be very
	// simple. Just check whether we have CID, and if so, check
	// whether the current item listing has everything. If it
	// doesn't, jump to Library or group. Done.

	for (var i = 0, ilen = history.length; i < ilen; i += 1) {
		var itemID = parseInt(history[i], 10);
		var item = this.Zotero.Items.get(itemID);
		if (this.CID && !item.inCollection(parseInt(this.CID.slice(1), 10))) {
			localOk = false;
			break;
		}
	}

	var cTree = this.ZoteroPane_Local.collectionsView;
	if (localOk) {
		// Set local
		cTree.rememberSelection(this.CID);
	} else {
		// Set library or group
		cTree.selectLibrary(this.LID);
	}

	// Get the items view
	var iTree = this.ZoteroPane_Local.itemsView;

	// Collapse all rows (forces selection of parents as a side-effect)
	iTree.collapseAllRows(iTree._treebox);
	// Make the rows exist.
	iTree.refresh();
	// Select an item to bring focus back to items listing.
	iTree.selectItem(history[0]);

	// Clear the item selection
	iTree.selection.clearSelection();
	// Select!
	iTree.rememberSelection(history);
};


ZoteroItemHistory.prototype.clearCollectionHistory = function () {
	this.history[this.LID][this.CID] = [];
	var sql = "DELETE FROM steps WHERE " + this.getSqlConditions();
	var params = this.getSqlParams();
	if (params.length) {
		this.db.query(sql, params);
	} else {
		this.db.query(sql);
	}
	this.setButtonStates();
};


ZoteroItemHistory.prototype.initHistoryOk = function (CID) {
	// Never, ever add anything to the database when LID
	// or CID are undefined
	if (!CID) {
		CID = this.CID;
	}
	if ("undefined" === typeof this.LID || "undefined" === typeof CID) {
		return false;
	}
	// init
	if (!this.history[this.LID]) {
		this.history[this.LID] = {};
	}
	if (!this.history[this.LID][CID]) {
		this.history[this.LID][CID] = [];
		var sql = "SELECT itemID FROM steps WHERE " + this.getSqlConditions();
		var params = this.getSqlParams();
		sql += " ORDER BY rowid";
		var items;
		if (params.length) {
			items = ZoteroItemHistory.db.columnQuery(sql, params);
		} else {
			items = ZoteroItemHistory.db.columnQuery(sql);
		}
		if (items && items.length) {
			// This is a little silly, but just to be sure
			for (var i = 0, ilen = items.length; i < ilen; i += 1) {
				items[i] = "" + items[i];
			}
			this.history[this.LID][CID] = items.slice();
		}
	}
	return true;
};


ZoteroItemHistory.prototype.addToHistory = function (itemID) {
	if (this.initHistoryOk()) {
		var history = this.history[this.LID][this.CID];
		var indexPos = history.indexOf("" + itemID);
		if (!history.length || indexPos === -1) {
			// Force to parent
			itemID = parseInt(itemID, 10);
			var parentID = this.Zotero.Items.get(itemID).getSource();
			if (parentID) {
				itemID = parentID;
			}

			// Collections are a little trickier. We add the target
			// ID to the list for this collection, and all of its
			// parents. There is no special linkage between the
			// lists; we just throw the IDs in on the general
			// principle that more tracking information is better
			// than less.

			// TODO
			var CIDlist = [this.CID];
			dump("YYY CID=" + this.CID + "\n");
			if (this.CID && this.CID.slice(0, 1) === "C") {
				var collectionID = this.CID.slice(1);
				dump("YYY collectionID=" + collectionID + "\n");
				var collection = this.Zotero.Collections.get(collectionID);
				dump("YYY collection=" + collection + "\n");
				dump("YYY collection.parent=" + collection.parent + "\n");
				while (collection.parent) {
					collectionID = collection.parent;
					dump("YYY collection.parent=" + collection.parent+"\n");
					var collection = this.Zotero.Collections.get(collectionID);
					CIDlist.push("C" + collectionID);
				}
			}
			for (var i = 0, ilen = CIDlist.length; i < ilen; i += 1) {
				this.addToDatabaseTable(itemID, CIDlist[i]);
			}
		} else {
			this.index = indexPos;
		}
	}
};


ZoteroItemHistory.prototype.addToDatabaseTable = function (itemID, CID) {
	// UNIQUE is not useful in this context, since we
	// track the Zotero DB in permitting NULL for libraryID
	// and collectionID, and NULLs are distinct in Sqlite
	// (which is normal for SQL, and I think means that
	// a column with a NULL value always passes the uniqueness
	// test -- at least that's the way the engine behaves).
	// So ... we have to test explicitly for uniqueness before
	// performing the insertion.
	if (this.initHistoryOk(CID)) {
		var sql = "SELECT COUNT(*) FROM steps WHERE " + this.getSqlConditions(CID);
		var params = this.getSqlParams(CID);
		sql += " AND itemID=?";
		params.push(itemID);
		var alreadyHasItemID = this.db.valueQuery(sql, params);
		if (!alreadyHasItemID) {
			// Add to history
			sql = "INSERT INTO steps VALUES (NULL,?,?,?)";
			ZoteroItemHistory.db.query(sql, [this.LID, CID, itemID]);
			this.history[this.LID][CID].push("" + itemID);
			this.index = this.history[this.LID][CID].length - 1;
		}
	}
};
