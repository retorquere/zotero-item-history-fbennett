/*global ZoteroItemHistory: true */
/*
 * Collection click listener
 */
ZoteroItemHistory.prototype.collectionTreeClickListener = function () {

	if (!this.windowsSeen.cTree[this.windowID]) {

		var Zotero = this.Zotero;

		try {
			var collectionTree = this.document.getElementById("zotero-collections-tree");
			var setCollectionHistoryAddress = this.setCollectionHistoryAddress;
			
			collectionTree.addEventListener("click", function () {
					// Force selection
					setCollectionHistoryAddress(true);
					if (ZoteroItemHistory.initHistoryOk()) {
						ZoteroItemHistory.index = -1;
					}
					ZoteroItemHistory.setButtonStates();
				}, false);
			
			// Block future attempts only if this one succeeded
			this.windowsSeen.cTree[this.windowID] = true;
		} catch (e) {
			this.Zotero.debug("ZoteroItemHistory [cTree]: " + e);
		}
	}
};
