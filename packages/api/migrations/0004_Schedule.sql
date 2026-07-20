-- CreateTable
CREATE TABLE "schedules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "folderId" INTEGER NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "startTime" DATETIME NOT NULL,
    CONSTRAINT "schedules_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "schedules_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
