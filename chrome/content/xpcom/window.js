/*global ZoteroItemHistory: true, Components: true */
/*
 * Initialize a window in the component. The method does the following:
 *
 * - If the extended navigation tabs are not present in the window's
 *   document, they are added.
 *
 * - The component's references to the nagivation tabs are updated,
 *   so that state changes are made to the tabs visible to the user.
 *
 * - Observers are set on the collection tree and the item tree
 *   to handle deletions in each, removing data applying to
 *   removed collections and trashed items respectively from
 *   the database.
 *
 * - Listeners are set on the collection tree and item tree,
 *   to update the buttons and the component's database as
 *   the user navigates the content.
 *
 * - A listener is set on the pane-mode element in the document,
 *   which sets the button states according to the current navigation
 *   state known to the component. For this last bit, we listen on the
 *   zotero-pane-stack element for changes to the "collapsed"
 *   attribute. The filtering applied is ad hoc, based on trial and
 *   error, and might break against subsequent releases of Zotero.
 *
 * - In addition to the above, the component checks available
 *   groups against the component's database records at startup,
 *   and deletes any records that apply to groups that are
 *   no longer accessible.
 */
ZoteroItemHistory.prototype.windowInit = function (window, document) {
	var i, ilen;
	this.window = window;
	this.document = document;

	var ZoteroPane_Local = window.ZoteroPane_Local;
	this.ZoteroPane_Local = ZoteroPane_Local;

	var util = this.window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIDOMWindowUtils);
	this.windowID = util.outerWindowID;

	var Zotero = this.Zotero;
	
	/*
	 * If nav tabs do not exist, create them and set references
	 *  in component.
	 *
	 * If nav tabs DO exist, set references in component and
	 * run setButtonStates() to initialize.
	 */
	var tabbox = document.getElementById("zotero-view-tabbox");
	var historybuttons = document.getElementsByClassName("zotero-item-history-button");
	var button;
	if (!historybuttons || !historybuttons.length) {
		// No classes found, do this.
		var newbuttons = [];
		for (i = 0, ilen = 3; i < ilen; i += 1) {
			button = document.createElement("toolbarbutton");
			newbuttons.push(button);
		}

		this.buttons = newbuttons;
		
		for (i = 0, ilen = newbuttons.length; i < ilen; i += 1) {
			var buttonName = this.buttonNameFromNumber[i];
			newbuttons[i].setAttribute("label", "");
			newbuttons[i].setAttribute("class", "zotero-item-history-button");
			this.enableButton(buttonName, false);
		}

		var myhbox = document.createElement("hbox");
		myhbox.setAttribute("flex", "1");

		for (i = 0, ilen = newbuttons.length; i < ilen; i += 1) {
			myhbox.appendChild(newbuttons[i]);
		}
		var mysep = document.createElement("hbox");
		mysep.setAttribute("flex", "1");
		myhbox.appendChild(mysep);

		
		var zoteroItemToolbar = document.getElementById("zotero-item-toolbar");
		var firstChild = zoteroItemToolbar.childNodes.item(0);
		firstChild.setAttribute("flex", false);
		var secondChild = zoteroItemToolbar.childNodes.item(1);
		zoteroItemToolbar.insertBefore(myhbox, secondChild);

		var popupset = document.getElementsByTagName("popupset").item(0);
		var menupopup = document.createElement("menupopup");
		menupopup.setAttribute("position", "after_start");
		menupopup.setAttribute("id", "zotero-item-history-menu");
		menupopup.setAttribute("onpopupshowing", "ZoteroItemHistory.buildHome(this);");
		var menuitem1 = document.createElement("menuitem");
		menuitem1.setAttribute("label", "Sample 1");
		menupopup.appendChild(menuitem1);
		var menuitem2 = document.createElement("menuitem");
		menuitem2.setAttribute("label", "Sample 2");
		menupopup.appendChild(menuitem2);
		popupset.appendChild(menupopup);

		var contextmenu = document.createElement("menupopup");
		contextmenu.setAttribute("id", "zotero-item-history-context");
		var deleter = document.createElement("menuitem");
		deleter.setAttribute("label", "Remove from collection history");
		deleter.setAttribute("onclick", "ZoteroItemHistory.removeEntry();");
		contextmenu.appendChild(deleter);
		popupset.appendChild(contextmenu);

		var globalcontextmenu = document.createElement("menupopup");
		globalcontextmenu.setAttribute("id", "zotero-item-history-global-context");
		var selector = document.createElement("menuitem");
		selector.setAttribute("label", "Select all items in collection history");
		selector.setAttribute("onclick", "ZoteroItemHistory.selectAll();");
		globalcontextmenu.appendChild(selector);
		var menusep = document.createElement("menuseparator");
		globalcontextmenu.appendChild(menusep);
		var purger = document.createElement("menuitem");
		purger.setAttribute("label", "Clear collection history");
		purger.setAttribute("onclick", "ZoteroItemHistory.clearCollectionHistory();");
		globalcontextmenu.appendChild(purger);
		popupset.appendChild(globalcontextmenu);
		
		var gohome = this.buttons[this.buttonNumberFromName.gohome];
		gohome.setAttribute("context", "zotero-item-history-global-context");
		gohome.setAttribute("popup", "zotero-item-history-menu");

	} else {
		// If classes found, do this completely other thing
		this.buttons = [];
		for (i = 0, ilen = historybuttons.length; i < ilen; i += 1) {
			button = historybuttons.item(i);
			this.buttons.push(button);
		}
	}

	// In both cases, we want to initialize the buttons.

	if ("undefined" !== typeof this.CID) {
		this.setButtonStates();
	}

	// Observer to purge deleted items
	if (this.itemDeletionWatcherHash) {
		this.Zotero.Notifier.unregisterObserver(this.itemDeletionWatcherHash);
	}
	this.itemDeletionWatcherHash = this.itemDeletionListener.init();

	// Observer to purge deleted collections
	if (this.collectionDeletionWatcherHash) {
		this.Zotero.Notifier.unregisterObserver(this.collectionDeletionWatcherHash);
	}
	this.collectionDeletionWatcherHash = this.collectionDeletionListener.init();

	// Function to set the address for browsing history.
	// Called via closure in the listeners invoked below.
	function setCollectionHistoryAddress (force) {
		if (!force && "undefined" !== typeof ZoteroItemHistory.LID) {
			return;
		}
		var libraryID, collectionID;
		var cTree = ZoteroPane_Local.collectionsView;
		var cTreeItem = cTree._getItemAtRow(cTree.selection.currentIndex);

		// Name blank by default
		ZoteroItemHistory.collectionName = "";

		if (cTreeItem.isLibrary()) {
			// Use, set name
			libraryID = null;
			collectionID = null;
			ZoteroItemHistory.collectionName = cTreeItem.getName();

		} else if (cTreeItem.isGroup()) {
			// Use, set name
			libraryID = Zotero.Groups.getLibraryIDFromGroupID(cTreeItem.ref.id);
			collectionID = null;
			ZoteroItemHistory.collectionName = cTreeItem.getName();

		} else if (cTreeItem.isCollection()) {
			// Use, set name
			libraryID = cTreeItem.ref.libraryID;
			collectionID = "C" + cTreeItem.ref.id;
			ZoteroItemHistory.collectionName = cTreeItem.getName();
		} else if (cTreeItem.isSearch()) {
			// Use, set name
			libraryID = cTreeItem.ref.libraryID;
			collectionID = "S" + cTreeItem.ref.id;
			ZoteroItemHistory.collectionName = cTreeItem.getName();

		} else if (cTreeItem.isTrash()) {
			libraryID = undefined;
			collectionID = undefined;
		} else if (cTreeItem.isHeader()) {
			libraryID = undefined;
			collectionID = undefined;
		} else if (cTreeItem.isSeparator()) {
			libraryID = undefined;
			collectionID = undefined;
		} else if (cTreeItem.isBucket()) {
			libraryID = undefined;
			collectionID = undefined;
		} else if (cTreeItem.isShare()) {
			libraryID = undefined;
			collectionID = undefined;
		} else {
			return;
		}
		if ("undefined" === typeof libraryID) {
			ZoteroItemHistory.disableAllButtons();
		}
		ZoteroItemHistory.LID = libraryID;
		ZoteroItemHistory.CID = collectionID;
	}
	this.setCollectionHistoryAddress = setCollectionHistoryAddress;

	this.paneStackListener();
	this.collectionTreeClickListener();
	this.itemTreeClickListener();
	this.relatedListClickListener();
};

ZoteroItemHistory.prototype.itemDeletionListener = {
	init: function () {
		// Initialize deletion observer
		var Zotero = Components.classes['@zotero.org/Zotero;1'].getService().wrappedJSObject;
		return Zotero.Notifier.registerObserver(this, "item");
	},
	
	notify: function (event, type, ids, extraData) {
		var i, ilen, sql;
		if (event == 'trash' || event == 'delete') {
			// Get the lib/collection addresses of lists containing
			// ids to be deleted.
			sql = "SELECT libraryID,collectionID FROM steps WHERE itemID IN (" + ids.join() + ")";
			var bundles = ZoteroItemHistory.db.query(sql);
			// Remove items in "ids" from history lists
			sql = "DELETE FROM steps WHERE itemID in (" + ids.join() + ")";
			ZoteroItemHistory.db.query(sql);
			
			// Remove itemID from lists inside ZoteroItemHistory.
			var LID, CID, history, index;
			for (i = 0, ilen = bundles.length; i < ilen; i += 1) {
				LID = bundles[i].libraryID;
				CID = bundles[i].collectionID;
				history = ZoteroItemHistory.history[LID][CID];
				// Not sure if this is really necessary.
				if (!LID) {
					LID = null;
				}
				if (!CID) {
					CID = null;
				}
				for (var j = ids.length - 1; j > -1; j += -1) {
					index = history.indexOf("" + ids[j]);
					if (index > -1) {
						ZoteroItemHistory.history[LID][CID] = history.slice(0, index).concat(history.slice(index + 1));
					}
				}
			}
		}
	}
};

ZoteroItemHistory.prototype.collectionDeletionListener = {
	init: function () {
		// Initialize deletion observer
		var Zotero = Components.classes['@zotero.org/Zotero;1'].getService().wrappedJSObject;
		return Zotero.Notifier.registerObserver(this, ["collection", "search"]);
	},
	
	notify: function (event, type, ids, extraData) {
		if (event == 'delete') {
			// XXXX Remove entire collection or saved search from history lists
			var sql = "DELETE FROM steps WHERE " + ZoteroItemHistory.getSqlConditions();
			var params = ZoteroItemHistory.getSqlParams();
			if (params.length) {
				ZoteroItemHistory.db.query(sql, params);
			} else {
				ZoteroItemHistory.db.query(sql);
			}
			// Unset LID and CID
			ZoteroItemHistory.LID = undefined;
			ZoteroItemHistory.CID = undefined;
			// Disable all buttons
			ZoteroItemHistory.disableAllButtons();
		}
	}
};
