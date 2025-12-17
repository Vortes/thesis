/*
  Warnings:

  - Added the required column `first_name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('PENDING', 'ACTIVE', 'BLOCKED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('DRAFTING', 'IN_TRANSIT', 'ARRIVED', 'OPENED', 'RECALLED');

-- CreateEnum
CREATE TYPE "MessengerStatus" AS ENUM ('AVAILABLE', 'LOADING', 'IN_TRANSIT', 'WAITING', 'RETURNING');

-- CreateEnum
CREATE TYPE "GiftType" AS ENUM ('TEXT', 'AUDIO', 'DRAWING', 'LINK', 'PHOTO');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Onboarding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initiatorId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Messenger" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "skinId" TEXT NOT NULL DEFAULT 'default_messenger',
    "status" "MessengerStatus" NOT NULL DEFAULT 'AVAILABLE',
    "currentShipmentId" TEXT,
    "currentHolderId" TEXT,

    CONSTRAINT "Messenger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'DRAFTING',
    "dispatchedAt" TIMESTAMP(3),
    "arrivalEstimate" TIMESTAMP(3),
    "distanceInKm" DOUBLE PRECISION,
    "originLat" DOUBLE PRECISION,
    "originLng" DOUBLE PRECISION,
    "destLat" DOUBLE PRECISION,
    "destLng" DOUBLE PRECISION,
    "messengerId" TEXT,
    "recalledAt" TIMESTAMP(3),

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftItem" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "type" "GiftType" NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "GiftItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Onboarding_userId_key" ON "Onboarding"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_initiatorId_recipientId_key" ON "Connection"("initiatorId", "recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "Messenger_connectionId_key" ON "Messenger"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Messenger_currentShipmentId_key" ON "Messenger"("currentShipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_email_senderId_key" ON "Invitation"("email", "senderId");

-- AddForeignKey
ALTER TABLE "Onboarding" ADD CONSTRAINT "Onboarding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messenger" ADD CONSTRAINT "Messenger_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "Connection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messenger" ADD CONSTRAINT "Messenger_currentShipmentId_fkey" FOREIGN KEY ("currentShipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_messengerId_fkey" FOREIGN KEY ("messengerId") REFERENCES "Messenger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftItem" ADD CONSTRAINT "GiftItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
