-- CreateTable
CREATE TABLE "Rally" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Nation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rallyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#f59e0b',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Nation_rallyId_fkey" FOREIGN KEY ("rallyId") REFERENCES "Rally" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tribe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rallyId" TEXT NOT NULL,
    "nationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tribe_rallyId_fkey" FOREIGN KEY ("rallyId") REFERENCES "Rally" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Tribe_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "Nation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rallyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nationId" TEXT NOT NULL,
    "tribeId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Person_rallyId_fkey" FOREIGN KEY ("rallyId") REFERENCES "Rally" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Person_nationId_fkey" FOREIGN KEY ("nationId") REFERENCES "Nation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Person_tribeId_fkey" FOREIGN KEY ("tribeId") REFERENCES "Tribe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rallyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "defaultPoints" INTEGER NOT NULL DEFAULT 10,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Challenge_rallyId_fkey" FOREIGN KEY ("rallyId") REFERENCES "Rally" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScoreLaunch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rallyId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetNationId" TEXT,
    "targetTribeId" TEXT,
    "targetPersonId" TEXT,
    "snapshotNationId" TEXT NOT NULL,
    "snapshotTribeId" TEXT,
    "points" INTEGER NOT NULL,
    "scoreDate" DATETIME NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "weekYear" INTEGER NOT NULL,
    "notes" TEXT,
    "idempotencyKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "voidReason" TEXT,
    "voidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScoreLaunch_rallyId_fkey" FOREIGN KEY ("rallyId") REFERENCES "Rally" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScoreLaunch_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScoreLaunch_targetPersonId_fkey" FOREIGN KEY ("targetPersonId") REFERENCES "Person" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeaderScoreLaunch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rallyId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "leaderRole" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "scoreDate" DATETIME NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "weekYear" INTEGER NOT NULL,
    "idempotencyKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "voidReason" TEXT,
    "voidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeaderScoreLaunch_rallyId_fkey" FOREIGN KEY ("rallyId") REFERENCES "Rally" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeaderScoreLaunch_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ScoreLaunch_idempotencyKey_key" ON "ScoreLaunch"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderScoreLaunch_idempotencyKey_key" ON "LeaderScoreLaunch"("idempotencyKey");
