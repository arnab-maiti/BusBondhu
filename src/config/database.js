import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaPg({
  connectionString,
});

export const prisma = new PrismaClient({ adapter });
export default prisma;
