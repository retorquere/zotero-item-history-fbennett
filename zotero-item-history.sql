-- 1
DROP TABLE IF EXISTS steps;
CREATE TABLE steps (
	seq INTEGER PRIMARY KEY,
    libraryID INTEGER,
    collectionID TEXT,
	itemID INTEGER NOT NULL
);
CREATE INDEX steps_AllData ON steps(libraryID, collectionID, itemID);

DROP TABLE IF EXISTS version;
CREATE TABLE version (
	schema TEXT,
	version INTEGER
);
