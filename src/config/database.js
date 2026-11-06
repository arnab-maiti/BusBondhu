import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const isTestEnvironment = process.env.NODE_ENV === "test";

// Never fall back to DATABASE_URL in test mode. Tests must opt in to a
// separate database explicitly, otherwise a missing test configuration
// could accidentally run against development data.
const connectionString = isTestEnvironment
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    isTestEnvironment
      ? "TEST_DATABASE_URL is required when NODE_ENV=test"
      : "DATABASE_URL is not configured"
  );
}

const adapter = new PrismaPg({
  connectionString,
});

export const prisma = new PrismaClient({ adapter });
export default prisma;
