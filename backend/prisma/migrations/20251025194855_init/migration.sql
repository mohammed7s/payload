-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "ethereumAddress" TEXT NOT NULL,
    "railgunWalletId" TEXT,
    "railgunAddress" TEXT,
    "encryptionKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_ethereumAddress_key" ON "User"("ethereumAddress");
