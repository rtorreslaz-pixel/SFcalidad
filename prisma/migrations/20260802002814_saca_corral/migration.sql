-- AlterTable
ALTER TABLE "SacaMuestreo" ADD COLUMN "complex" TEXT;
ALTER TABLE "SacaMuestreo" ADD COLUMN "corral" TEXT;

-- CreateIndex
CREATE INDEX "SacaMuestreo_complex_idx" ON "SacaMuestreo"("complex");
