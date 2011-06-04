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

/*global Components: true, XPCOMUtils: true */

const Cc = Components.classes;
const Ci = Components.interfaces;

var WrappedZoteroItemHistory = this;

Components.utils["import"]("resource://gre/modules/XPCOMUtils.jsm");

var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
                         .getService(Components.interfaces.nsIXULAppInfo);
if(appInfo.platformVersion[0] >= 2) {
	Components.utils.import("resource://gre/modules/AddonManager.jsm");
}

var xpcomFiles = [
	"history",
	"utilities",
	"window",
	"item-tree-listener",
	"collection-tree-listener",
	"pane-stack-listener",
	"related-list-listener",
	"navigation",
	"display-listing",
	"purge-missing-groups"
];

for (var i=0, ilen=xpcomFiles.length; i < ilen; i += 1) {
	try {
		Cc["@mozilla.org/moz/jssubscript-loader;1"]
			.getService(Ci.mozIJSSubScriptLoader)
			.loadSubScript("chrome://zotero-item-history/content/xpcom/" + xpcomFiles[i] + ".js");
	}
	catch (e) {
		Components.utils.reportError("Error loading " + xpcomFiles[i] + ".js");
		throw (e);
	}
}

var ZoteroItemHistory = new ZoteroItemHistory();

function setupService(){
	try {
		ZoteroItemHistory.init();
	} catch (e) {
		var msg = typeof e == 'string' ? e : e.name;
		dump(e + "\n\n");
		Components.utils.reportError(e);
		Zotero.debug("[ZoteroItemHistory] " + e);
		throw (e);
	}
}

function ZoteroItemHistoryService() { 
	this.wrappedJSObject = WrappedZoteroItemHistory.ZoteroItemHistory;
	setupService();
}

ZoteroItemHistoryService.prototype = {
  classDescription: 'Zotero Item History Extension',
  classID:          Components.ID("{487b2ad0-8426-11e0-9d78-0800200c9a66}"),
  contractID:       '@mysterylab/ZoteroItemHistoryService;1',
  service: true,
  QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsISupports])
};

if (XPCOMUtils.generateNSGetFactory) {
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([ZoteroItemHistoryService]);
} else {
	var NSGetModule = XPCOMUtils.generateNSGetModule([ZoteroItemHistoryService]);
}
