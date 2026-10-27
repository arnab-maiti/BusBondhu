//bbgps_877ce9f6ae11fea04065cf7c3537b5398a98c6668050ffc130ef62c7794fb382
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  generateGpsApiKey,
  hashGpsApiKey,
} from "../src/utils/gpsKeys.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured in .env");
}

const busId = Number(process.argv[2]);
const deviceName = process.argv.slice(3).join(" ").trim();

if (!Number.isInteger(busId) || busId <= 0 || !deviceName) {
  console.error(
    'Usage: node scripts/create-gps-device.js <busId> "<device name>"'
  );
  process.exit(1);
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

try {
  const bus = await prisma.bus.findUnique({
    where: { id: busId },
    select: { id: true, busNumber: true },
  });

  if (!bus) {
    throw new Error(`Bus with ID ${busId} does not exist.`);
  }

  const apiKey = generateGpsApiKey();
  const keyHash = hashGpsApiKey(apiKey);

  const device = await prisma.gpsDevice.create({
    data: {
      name: deviceName,
      keyHash,
      busId: bus.id,
    },
    select: {
      id: true,
      name: true,
      busId: true,
      isActive: true,
      createdAt: true,
    },
  });

  console.log("\nGPS device registered successfully.");
  console.log(JSON.stringify(device, null, 2));
  console.log("\nDEVICE API KEY (copy now; shown only once):");
  console.log(apiKey);
} catch (error) {
  console.error("GPS device registration failed:", error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
