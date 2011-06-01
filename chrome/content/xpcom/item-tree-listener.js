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

/*global ZoteroItemHistory: true, ZoteroPane_Local: true */

/*
 * Tree click listener
 */
ZoteroItemHistory.prototype.itemTreeClickListener = function () {

	if (!this.windowsSeen.iTree[this.windowID]) {

		var Zotero = this.Zotero;
		
		try {
			var setCollectionHistoryAddress = this.setCollectionHistoryAddress;
			var itemTree = this.document.getElementById("zotero-items-tree");
			var ZoteroPane_Local = this.ZoteroPane_Local;
			itemTree.addEventListener("click", function (event) {
					// Treat multiple selection operations as noise.
					if (event.shiftKey || event.ctrlKey) {
						return;
					}
					var iTree = ZoteroPane_Local.itemsView;
					var iTreeItem = iTree._getItemAtRow(iTree.selection.currentIndex);
					// Initialize history if this is our first click of the session
					if ("undefined" === typeof ZoteroItemHistory.LID) {
						// Distinction without a difference, but don't force selection
						setCollectionHistoryAddress(false);
					}
					if (ZoteroItemHistory.initHistoryOk()) {
						ZoteroItemHistory.addToHistory(iTreeItem.ref.id);
					}
					ZoteroItemHistory.setButtonStates();
				}, false);
			
			// Block future attempts only if this one succeeded
			this.windowsSeen.iTree[this.windowID] = true;
		} catch (e) {
			this.Zotero.debug("ZoteroItemHistory [iTree]: " + e);
		}
	}
};

