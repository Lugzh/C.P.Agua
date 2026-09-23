-- DropForeignKey
ALTER TABLE `PurchaseRequest` DROP FOREIGN KEY `PurchaseRequest_supplierId_fkey`;

-- AlterTable
ALTER TABLE `PurchaseRequest` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    MODIFY `supplierId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `PurchaseRequest_deletedAt_idx` ON `PurchaseRequest`(`deletedAt`);

-- AddForeignKey
ALTER TABLE `PurchaseRequest` ADD CONSTRAINT `PurchaseRequest_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
