import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";
import pg from "pg";
import {
  assertTestDatabaseIdentity,
  getTestDatabaseConfig,
  redactDatabaseSecrets,
} from "../tests/support/database-safety.js";

const { Client } = pg;

dotenv.config({ quiet: true });

const envPath = path.resolve(process.cwd(), ".env");

function buildDerivedTestUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not configured; cannot derive a test database"
    );
  }

  let developmentUrl;

  try {
    developmentUrl = new URL(process.env.DATABASE_URL);
  } catch {
    throw new Error("DATABASE_URL is not a valid PostgreSQL URL");
  }

  const developmentDatabase = decodeURIComponent(
    developmentUrl.pathname.replace(/^\/+/, "")
  );

  if (!developmentDatabase) {
    throw new Error("DATABASE_URL does not include a database name");
  }

  const testDatabaseName = `${developmentDatabase}_test`;
  const testUrl = new URL(developmentUrl.toString());
  testUrl.pathname = `/${encodeURIComponent(testDatabaseName)}`;

  return testUrl.toString();
}

function ensureEnvEntry(testUrl) {
  const content = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf8")
    : "";

  if (/^\s*TEST_DATABASE_URL\s*=/m.test(content)) {
    return false;
  }

  const separator =
    content.length > 0 && !content.endsWith("\n") ? "\n" : "";

  fs.appendFileSync(
    envPath,
    `${separator}TEST_DATABASE_URL=${testUrl}\n`,
    "utf8"
  );

  return true;
}

async function openClient(connectionString) {
  const client = new Client({ connectionString });
  await client.connect();
  return client;
}

async function getCurrentDatabase(client) {
  const result = await client.query(
    "SELECT current_database() AS name"
  );

  return result.rows[0]?.name;
}

async function verifyExistingDatabase(config) {
  const client = await openClient(config.url);

  try {
    await assertTestDatabaseIdentity(client);
  } finally {
    await client.end().catch(() => {});
  }
}

async function createDatabase(config) {
  const maintenanceUrl = new URL(config.url);
  maintenanceUrl.pathname = "/postgres";

  const maintenanceClient = await openClient(
    maintenanceUrl.toString()
  );

  try {
    const maintenanceDatabase =
      await getCurrentDatabase(maintenanceClient);

    if (maintenanceDatabase !== "postgres") {
      throw new Error(
        "Could not verify the PostgreSQL maintenance connection"
      );
    }

    if (!/^[A-Za-z0-9_-]+$/.test(config.databaseName)) {
      throw new Error(
        "The test database name contains unsupported characters"
      );
    }

    await maintenanceClient.query(
      `CREATE DATABASE "${config.databaseName}"`
    );
  } finally {
    await maintenanceClient.end().catch(() => {});
  }
}

async function ensureTestDatabase() {
  let config = getTestDatabaseConfig();

  try {
    await verifyExistingDatabase(config);
    console.log(
      "Test database already exists and passed identity verification."
    );
    return;
  } catch (error) {
    if (error?.code !== "3D000") {
      throw error;
    }
  }

  await createDatabase(config);
  console.log("Created a new dedicated test database.");

  config = getTestDatabaseConfig();
  await verifyExistingDatabase(config);
}

async function main() {
  if (!process.env.TEST_DATABASE_URL) {
    const testUrl = buildDerivedTestUrl();
    const added = ensureEnvEntry(testUrl);
    process.env.TEST_DATABASE_URL = testUrl;

    if (added) {
      console.log("Added TEST_DATABASE_URL to the local .env file.");
    }
  }

  await ensureTestDatabase();
  console.log(
    "Test database setup completed without modifying DATABASE_URL."
  );
}

main().catch((error) => {
  const message = redactDatabaseSecrets(error?.message, [
    process.env.TEST_DATABASE_URL,
    process.env.DATABASE_URL,
  ]);

  console.error(`Test database setup failed: ${message}`);
  process.exitCode = 1;
});
