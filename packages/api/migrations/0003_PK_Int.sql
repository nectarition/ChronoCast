-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_folders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL
);
INSERT INTO "new_folders" ("id", "slug") SELECT "id", "slug" FROM "folders";
DROP TABLE "folders";
ALTER TABLE "new_folders" RENAME TO "folders";
CREATE UNIQUE INDEX "folders_slug_key" ON "folders"("slug");
CREATE TABLE "new_sources" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "folderId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "sources_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_sources" ("folderId", "id", "name") SELECT "folderId", "id", "name" FROM "sources";
DROP TABLE "sources";
ALTER TABLE "new_sources" RENAME TO "sources";
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oidcSub" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_users" ("createdAt", "id", "isActive", "oidcSub") SELECT "createdAt", "id", "isActive", "oidcSub" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_oidcSub_key" ON "users"("oidcSub");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
