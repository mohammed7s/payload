-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ethereumAddress" TEXT NOT NULL,
    "railgunWalletId" TEXT,
    "railgunAddress" TEXT,
    "encryptionKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_ethereumAddress_key" ON "User"("ethereumAddress");
