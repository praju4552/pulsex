-- AlterTable: Add billing address and GST fields to PrototypingOrder
ALTER TABLE `PrototypingOrder`
  ADD COLUMN IF NOT EXISTS `billingName` VARCHAR(191),
  ADD COLUMN IF NOT EXISTS `billingStreetAddress` VARCHAR(191),
  ADD COLUMN IF NOT EXISTS `billingApartment` VARCHAR(191),
  ADD COLUMN IF NOT EXISTS `billingCity` VARCHAR(191),
  ADD COLUMN IF NOT EXISTS `billingState` VARCHAR(191),
  ADD COLUMN IF NOT EXISTS `billingZip` VARCHAR(191),
  ADD COLUMN IF NOT EXISTS `billingCountry` VARCHAR(191),
  ADD COLUMN IF NOT EXISTS `gstNumber` VARCHAR(191);

-- AlterTable: Add billing address and GST fields to PrototypingUser
ALTER TABLE `PrototypingUser`
  ADD COLUMN IF NOT EXISTS `billingStreetAddress` VARCHAR(191),
  ADD COLUMN IF NOT EXISTS `billingApartment` VARCHAR(191),
  ADD COLUMN IF NOT EXISTS `billingCity` VARCHAR(191),
  ADD COLUMN IF NOT EXISTS `billingState` VARCHAR(191),
  ADD COLUMN IF NOT EXISTS `billingZip` VARCHAR(191),
  ADD COLUMN IF NOT EXISTS `billingCountry` VARCHAR(191),
  ADD COLUMN IF NOT EXISTS `gstNumber` VARCHAR(191);
