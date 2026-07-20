-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_schedules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "folderId" INTEGER NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    CONSTRAINT "schedules_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "schedules_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_schedules" ("folderId", "id", "sourceId") SELECT "folderId", "id", "sourceId" FROM "schedules";
DROP TABLE "schedules";
ALTER TABLE "new_schedules" RENAME TO "schedules";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
