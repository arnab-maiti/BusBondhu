import http from "node:http";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  assertTestDatabaseIdentity,
  getTestDatabaseConfig,
  redactDatabaseSecrets,
} from "../support/database-safety.js";
import {
  GPS_BUS_ID,
  resetFixtures,
  seedFixtures,
} from "../support/fixtures.js";

dotenv.config({ quiet: true });
process.env.NODE_ENV = "test";

function runPrismaMigrate(testUrl) {
  const prismaCli = path.resolve(
    process.cwd(),
    "node_modules",
    "prisma",
    "build",
    "index.js"
  );

  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [prismaCli, "migrate", "deploy"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          DATABASE_URL: testUrl,
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let output = "";

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });

    child.once("error", () => {
      reject(
        new Error(
          "Could not start Prisma to prepare the test database"
        )
      );
    });

    child.once("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const safeOutput = redactDatabaseSecrets(output, [testUrl])
        .trim()
        .slice(-800);

      reject(
        new Error(
          `Test database migration failed. Run npm run test:db:setup and verify the test database.${safeOutput ? ` ${safeOutput}` : ""}`
        )
      );
    });
  });
}

function listenOnRandomPort(server) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };

    const onListening = () => {
      server.off("error", onError);
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(0, "127.0.0.1");
  });
}

async function closeServer(server) {
  await new Promise((resolve) => {
    server.close(() => resolve());

    if (typeof server.closeAllConnections === "function") {
      server.closeAllConnections();
    }
  });
}

export async function setup(project) {
  const config = getTestDatabaseConfig();

  await runPrismaMigrate(config.url);
  console.log("Test database schema is up to date.");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: config.url,
    }),
  });

  let server;

  try {
    await assertTestDatabaseIdentity(prisma);
    await resetFixtures(prisma);
    await seedFixtures(prisma);
    console.log("Deterministic test fixtures are ready.");

    const { default: app } = await import("../../src/app.js");
    server = http.createServer(app);
    await listenOnRandomPort(server);

    const address = server.address();
    const apiBaseUrl = `http://127.0.0.1:${address.port}`;

    project.provide("apiBaseUrl", apiBaseUrl);
    project.provide("gpsBusId", GPS_BUS_ID);

    console.log(`Test server is listening on a random localhost port.`);
  } catch (error) {
    await prisma.$disconnect().catch(() => {});
    throw error;
  }

  return async () => {
    let appPrisma;

    try {
      if (server) {
        await closeServer(server);
      }

      const databaseModule = await import(
        "../../src/config/database.js"
      );
      appPrisma = databaseModule.prisma;
      await appPrisma.$disconnect().catch(() => {});

      await assertTestDatabaseIdentity(prisma);
      await resetFixtures(prisma);
    } catch (error) {
      const message = redactDatabaseSecrets(error?.message, [
        config.url,
        process.env.DATABASE_URL,
      ]);
      throw new Error(`Test teardown failed: ${message}`, {
        cause: error,
      });
    } finally {
      await appPrisma?.$disconnect().catch(() => {});
      await prisma.$disconnect().catch(() => {});
    }
  };
}
