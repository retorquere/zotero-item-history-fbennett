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

ZoteroItemHistory.prototype.purgeMissingGroups = function () {

	var Zotero = this.Zotero;

	try {
		// Get a list of libraryIDs for all available groups.
		var availableGroups = this.Zotero.Groups.getAll();
		var libraryIDs = [];
		for (var i = 0, ilen = availableGroups.length; i < ilen; i += 1) {
			libraryIDs.push(availableGroups[i].libraryID);
		}
		
		// Check that the steps table exists
		var sql = "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='steps'";
		var tableExists = this.db.valueQuery(sql);
		if (tableExists) {
			// Delete data that applies to unknown groups
			sql = "DELETE FROM steps WHERE libraryID IS NOT NULL";
			if (libraryIDs.length) {
				sql += " AND libraryID NOT IN (" + libraryIDs.join() + ")";
			}
			this.db.query(sql);
		}
	} catch (e) {
		if (this.Zotero) {
			this.Zotero.debug("ZoteroItemHistory [purge]: " + e);
		}
	}
};
