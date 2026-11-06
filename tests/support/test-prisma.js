import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  assertTestDatabaseIdentity,
  getTestDatabaseConfig,
} from "./database-safety.js";

export async function createGuardedTestPrisma() {
  const config = getTestDatabaseConfig();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: config.url,
    }),
  });

  try {
    await assertTestDatabaseIdentity(prisma);
    return prisma;
  } catch (error) {
    await prisma.$disconnect().catch(() => {});
    throw error;
  }
}
