/*global ZoteroItemHistory: true */

ZoteroItemHistory.prototype.relatedListClickListener = function () {

	if (!this.windowsSeen.relatedList[this.windowID]) {

		try {
			var setCollectionHistoryAddress = this.setCollectionHistoryAddress;
			var relatedList = this.document.getElementById("seeAlsoRows");
			var Zotero = this.Zotero;
			relatedList.addEventListener("click", function (event) {
					if (event.target.getAttribute("value") !== "-") {
						var row = Zotero.getAncestorByTagName(event.target, "row");
						var itemID = row.getAttribute("id");
						itemID = parseInt(itemID.replace("seealso-", ""), 10);
						ZoteroItemHistory.addToHistory(itemID);
						ZoteroItemHistory.showInCollection();
					}
				}, false);
			
			// Block future attempts only if this one succeeded
			this.windowsSeen.relatedList[this.windowID] = true;
		} catch (e) {
			this.Zotero.debug("ZoteroItemHistory [relatedList]: " + e);
		}
	}
};
