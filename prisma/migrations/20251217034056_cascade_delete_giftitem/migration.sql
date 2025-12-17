-- DropForeignKey
ALTER TABLE "GiftItem" DROP CONSTRAINT "GiftItem_shipmentId_fkey";

-- AddForeignKey
ALTER TABLE "GiftItem" ADD CONSTRAINT "GiftItem_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
