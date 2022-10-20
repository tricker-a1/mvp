-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Employee', 'Admin', 'SuperAdmin');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('InviteEmployees', 'ManageBillingInformation', 'SetPermissionsForOthers');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "issuer" TEXT,
    "email" TEXT NOT NULL,
    "recoveringEmail" TEXT,
    "firstname" TEXT,
    "lastname" TEXT,
    "role" "Role" NOT NULL DEFAULT 'Employee',
    "isEnrolled" BOOLEAN NOT NULL,
    "inviterId" TEXT,
    "avatar" TEXT,
    "username" TEXT,
    "country" TEXT,
    "startOfWork" TIMESTAMP(3),
    "dateOfBirth" TIMESTAMP(3),
    "phone" TEXT,
    "isFired" BOOLEAN DEFAULT false,
    "firingReason" TEXT,
    "xpub" TEXT,
    "wallets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "permissions" "Permission"[],
    "customerId" TEXT,
    "companyId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "industryId" UUID NOT NULL,
    "country" TEXT,
    "website" TEXT,
    "size" INTEGER NOT NULL,
    "brandColor" TEXT,
    "includeLogoOnWall" BOOLEAN NOT NULL DEFAULT true,
    "linkedin" TEXT,
    "facebook" TEXT,
    "twitter" TEXT,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Industry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Industry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hashtag" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyHashtag" (
    "companyId" UUID NOT NULL,
    "hashtagId" UUID NOT NULL,

    CONSTRAINT "CompanyHashtag_pkey" PRIMARY KEY ("companyId","hashtagId")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "paymentMethodId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID,
    "companyId" UUID,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_issuer_key" ON "User"("issuer");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_issuer_idx" ON "User"("issuer");

-- CreateIndex
CREATE UNIQUE INDEX "Industry_value_key" ON "Industry"("value");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyHashtag" ADD CONSTRAINT "CompanyHashtag_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyHashtag" ADD CONSTRAINT "CompanyHashtag_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
