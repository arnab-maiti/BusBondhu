-- CreateTable
CREATE TABLE "BusLocation" (
    "id" SERIAL NOT NULL,
    "busId" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusLocation_busId_recordedAt_idx" ON "BusLocation"("busId", "recordedAt");

-- AddForeignKey
ALTER TABLE "BusLocation" ADD CONSTRAINT "BusLocation_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
