const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);
const TEST_DATABASE_NAME_PATTERN = /(^|[_-])test($|[_-])/i;
const PRODUCTION_NAME_PATTERN =
  /(^|[^a-z])(prod|production|live|primary)([^a-z]|$)/i;
const DATABASE_URL_PATTERN = /postgres(?:ql)?:\/\/[^\s"'`<>]+/gi;

function safetyError(message) {
  return new Error(`Test database safety check failed: ${message}`);
}

function parsePostgresUrl(value, variableName) {
  if (typeof value !== "string" || !value.trim()) {
    throw safetyError(`${variableName} is not configured`);
  }

  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw safetyError(`${variableName} is not a valid PostgreSQL URL`);
  }

  if (!POSTGRES_PROTOCOLS.has(parsed.protocol)) {
    throw safetyError(`${variableName} must use a PostgreSQL URL`);
  }

  const databaseName = decodeURIComponent(
    parsed.pathname.replace(/^\/+/, "")
  );

  if (!databaseName) {
    throw safetyError(`${variableName} must include a database name`);
  }

  const port = parsed.port || "5432";

  return {
    url: value,
    databaseName,
    identity: `${parsed.hostname}:${port}/${databaseName}`,
  };
}

function assertNotProductionTarget(target, variableName) {
  if (
    PRODUCTION_NAME_PATTERN.test(target.databaseName) ||
    PRODUCTION_NAME_PATTERN.test(new URL(target.url).hostname)
  ) {
    throw safetyError(
      `${variableName} looks like a production database and was refused`
    );
  }
}

export function isTestDatabaseName(databaseName) {
  return TEST_DATABASE_NAME_PATTERN.test(databaseName);
}

export function getTestDatabaseConfig() {
  const test = parsePostgresUrl(
    process.env.TEST_DATABASE_URL,
    "TEST_DATABASE_URL"
  );

  assertNotProductionTarget(test, "TEST_DATABASE_URL");

  if (!isTestDatabaseName(test.databaseName)) {
    throw safetyError(
      "TEST_DATABASE_URL must use a database name containing a test segment"
    );
  }

  let developmentIdentity = null;

  if (process.env.DATABASE_URL) {
    const development = parsePostgresUrl(
      process.env.DATABASE_URL,
      "DATABASE_URL"
    );

    developmentIdentity = development.identity;

    if (development.identity === test.identity) {
      throw safetyError(
        "TEST_DATABASE_URL must not point to the development database"
      );
    }
  }

  return {
    url: test.url,
    databaseName: test.databaseName,
    identity: test.identity,
    developmentIdentity,
  };
}

export async function assertTestDatabaseIdentity(client) {
  const config = getTestDatabaseConfig();
  let connectedDatabase;

  if (typeof client?.query === "function") {
    const result = await client.query(
      "SELECT current_database() AS name"
    );
    connectedDatabase = result.rows[0]?.name;
  } else if (typeof client?.$queryRaw === "function") {
    const result =
      await client.$queryRaw`SELECT current_database() AS name`;
    connectedDatabase = result[0]?.name;
  } else {
    throw safetyError(
      "A PostgreSQL client is required for identity verification"
    );
  }

  if (connectedDatabase !== config.databaseName) {
    throw safetyError(
      "The connected database does not match TEST_DATABASE_URL"
    );
  }

  if (!isTestDatabaseName(connectedDatabase)) {
    throw safetyError(
      "The connected database name does not contain a test segment"
    );
  }

  return config;
}

export function redactDatabaseSecrets(value, extraValues = []) {
  let text = String(value ?? "");

  for (const extraValue of extraValues) {
    if (extraValue) {
      text = text.split(extraValue).join("[redacted database URL]");
    }
  }

  return text.replace(
    DATABASE_URL_PATTERN,
    "[redacted database URL]"
  );
}
