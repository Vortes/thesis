-- AlterTable
ALTER TABLE "Messenger" ADD COLUMN     "revealedToInitiator" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "revealedToRecipient" BOOLEAN NOT NULL DEFAULT false;
