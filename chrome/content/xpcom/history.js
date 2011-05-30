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

/*global ZoteroItemHistory: true, Components: true, AddonManager: true */

ZoteroItemHistory = function () {
	this.windowsSeen = {};
	this.windowsSeen.cTree = {};
	this.windowsSeen.iTree = {};
	this.windowsSeen.pStack = {};
	this.windowsSeen.relatedList = {};
	this.hasSeenStack = false;

	this.Zotero = Components.classes['@zotero.org/Zotero;1'].getService().wrappedJSObject;
	var Zotero = this.Zotero;

	this.db = new this.Zotero.DBConnection("zotero-item-history");

	this.history = {};

	// Stuff shamelessly borrowed from Zotero (zotero.js)
	this.mainThread = Components.classes["@mozilla.org/thread-manager;1"].getService().mainThread;
	var appInfo =
		Components.classes["@mozilla.org/xre/app-info;1"].
		getService(Components.interfaces.nsIXULAppInfo);
	this.isFx4 = appInfo.platformVersion[0].slice(0, 1) == "2";

	Components.utils["import"]("resource://gre/modules/AddonManager.jsm"); 

	if(this.isFx4) {
		AddonManager.getAddonByID("zotero-item-history@mystery-lab.com",
			function(addon) { ZoteroItemHistory.version = addon.version; ZoteroItemHistory.addon = addon; });
	} else {
		var gExtensionManager =
			Components.classes["@mozilla.org/extensions/manager;1"]
			.getService(Components.interfaces.nsIExtensionManager);
		this.version
			= gExtensionManager.getItemForID("zotero-item-history@mystery-lab.com").version;
	}
	
	var schema = "zotero-item-history";
	var schemaFile = schema + '.sql';
	AddonManager.getAddonByID("zotero-item-history@mystery-lab.com", function(addon) {
			
			// From Zotero getInstallDirectory()
			var file;
			// More stuff shamelessly borrowed from zotero.js
			if(ZoteroItemHistory.isFx4) {
				while(ZoteroItemHistory.addon === undefined) ZoteroItemHistory.mainThread.processNextEvent(true);
				var resourceURI = ZoteroItemHistory.addon.getResourceURI();
				file = resourceURI.QueryInterface(Components.interfaces.nsIFileURL).file;
			} else {
				var id = 'zotero-item-history@mystery-lab.com';
				var em = Components.classes["@mozilla.org/extensions/manager;1"]
							.getService(Components.interfaces.nsIExtensionManager);
				file= em.getInstallLocation(id).getItemLocation(id);
			}
			file.append(schemaFile);
			var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
				.createInstance(Components.interfaces.nsIFileInputStream);
			istream.init(file, 0x01, 444, 0);
			istream.QueryInterface(Components.interfaces.nsILineInputStream);
			
			var line = {}, sql = '', hasmore;
			
			// Skip the first line, which contains the schema version
			var version = istream.readLine(line);
			version = line.value.replace(/^--\s+([0-9]+).*/, "$1");
			if (!version.match(/^[0-9]+$/)) {
				throw "Bad DB in zotero-item-history plugin: no version";
			} else if (!ZoteroItemHistory.db.tableExists("steps")
					   || parseInt(version, 10) > parseInt(ZoteroItemHistory.db.valueQuery("SELECT version FROM version WHERE schema='history'"), 10)) {
				do {
					hasmore = istream.readLine(line);
					sql += line.value + "\n";
				} while(hasmore);
				
				istream.close();
				
				ZoteroItemHistory.db.query(sql);
				sql = "INSERT INTO version VALUES (?,?)";
				ZoteroItemHistory.db.query(sql, ["history", version]);
			}
		});
	this.purgeMissingGroups();
};
