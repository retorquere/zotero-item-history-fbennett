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

/*global ZoteroItemHistory: true, window: true, document: true */

/*
 * Pane stack listener
 */
ZoteroItemHistory.prototype.paneStackListener = function () {

	if (!this.windowsSeen.pStack[this.windowID]) {

		var Zotero = this.Zotero;

		try {
			var stack = this.document.getElementById("zotero-pane-stack");
			var window = this.window;
			var document = this.document;
			stack.addEventListener("DOMAttrModified", function () {
					// Any panel reveal: newValue="false"
					if (arguments[0].attrName === "collapsed") {
						if (arguments[0].newValue === "false") {
							ZoteroItemHistory.windowInit(window, document);
						}
					} else if (arguments[0].attrName === "hidden") {
						//dump("XXX attr="+arguments[0].attrName+", val="+arguments[0].newValue+", type="+typeof arguments[0].newValue);
						if (arguments[0].newValue === "false" && !ZoteroItemHistory.hasSeenStack) {
							ZoteroItemHistory.windowInit(window, document);
							ZoteroItemHistory.hasSeenStack = true;
						}
					}
				}, true);
			// Block future attempts only if this one succeeded
			this.windowsSeen.pStack[this.windowID] = true;
		} catch (e) {
			this.Zotero.debug("ZoteroItemHistory [pane]: " + e);
		}
	}
};
