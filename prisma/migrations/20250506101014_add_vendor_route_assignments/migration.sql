-- CreateTable
CREATE TABLE "VendorRoute" (
    "vendorId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,

    CONSTRAINT "VendorRoute_pkey" PRIMARY KEY ("vendorId","routeId")
);

-- CreateIndex
CREATE INDEX "VendorRoute_vendorId_idx" ON "VendorRoute"("vendorId");

-- CreateIndex
CREATE INDEX "VendorRoute_routeId_idx" ON "VendorRoute"("routeId");

-- AddForeignKey
ALTER TABLE "VendorRoute" ADD CONSTRAINT "VendorRoute_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRoute" ADD CONSTRAINT "VendorRoute_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
