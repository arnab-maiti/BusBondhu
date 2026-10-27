
import { afterAll, beforeAll, describe, it, expect } from "vitest";
import dotenv from "dotenv";
import process from "node:process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { generateGpsApiKey, hashGpsApiKey } from "../src/utils/gpsKeys.js";
dotenv.config();
const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:5000";
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});
let gpsApiKey;
let gpsDeviceId;
beforeAll(async () => {
  const bus = await prisma.bus.findUnique({
    where: { id: 1 },
    select: { id: true },
  });

  if (!bus) {
    throw new Error("API tests require bus with ID 1");
  }

  gpsApiKey = generateGpsApiKey();
 const device = await prisma.gpsDevice.create({
  data: {
    name: "API test device",
    keyHash: hashGpsApiKey(gpsApiKey),
    busId: bus.id,
  },
  select: {
    id: true,
  },
});

gpsDeviceId = device.id;
});

afterAll(async () => {
  if (gpsDeviceId) {
  await prisma.gpsDevice.deleteMany({
    where: { id: gpsDeviceId },
  });
}

  await prisma.$disconnect();
});

describe("BusBondhu API", () => {
  it("GET /api/health should return 200", async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("GET /api/buses should return a paginated list", async () => {
    const response = await fetch(
      `${BASE_URL}/api/buses?page=1&limit=10`
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.limit).toBe(10);
  });

  it("GET /api/buses?page=0 should return 400", async () => {
    const response = await fetch(`${BASE_URL}/api/buses?page=0`);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("POST location with invalid latitude should return 400", async () => {
    const response = await fetch(`${BASE_URL}/api/buses/1/location`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": gpsApiKey,
      },
      body: JSON.stringify({
        latitude: 95,
        longitude: 88.3639,
        speed: 25,
      }),
    });

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });
});

it("GPS endpoint should return 429 after exceeding the rate limit", async () => {
  const rateLimitApiKey = generateGpsApiKey();
  const rateLimitDevice = await prisma.gpsDevice.create({
    data: {
      name: "API rate-limit test device",
      keyHash: hashGpsApiKey(rateLimitApiKey),
      busId: 1,
    },
    select: { id: true },
  });

  try {
    const requests = Array.from({ length: 65 }, () =>
      fetch(`${BASE_URL}/api/buses/1/location`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": rateLimitApiKey,
        },
        body: JSON.stringify({
          latitude: 95,
          longitude: 88.3639,
          speed: 20,
        }),
      })
    );

    const responses = await Promise.all(requests);
    const statuses = responses.map((response) => response.status);

    expect(statuses).toContain(429);
  } finally {
    await prisma.gpsDevice.delete({
      where: { id: rateLimitDevice.id },
    });
  }
});

it("GPS endpoint should reject a missing API key", async () => {
  const response = await fetch(
    `${BASE_URL}/api/buses/1/location`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: 22.5726,
        longitude: 88.3639,
        speed: 20,
      }),
    }
  );

  expect(response.status).toBe(401);
});

it("GPS endpoint should reject an invalid API key", async () => {
  const response = await fetch(
    `${BASE_URL}/api/buses/1/location`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "invalid-test-key",
      },
      body: JSON.stringify({
        latitude: 22.5726,
        longitude: 88.3639,
        speed: 20,
      }),
    }
  );

  expect(response.status).toBe(401);
});

it("GPS endpoint should reject an inactive device", async () => {
  await prisma.gpsDevice.update({
    where: { id: gpsDeviceId },
    data: { isActive: false },
  });

  const response = await fetch(`${BASE_URL}/api/buses/1/location`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": gpsApiKey,
    },
    body: JSON.stringify({
      latitude: 22.5726,
      longitude: 88.3639,
      speed: 20,
    }),
  });

  expect(response.status).toBe(401);

  // Restore the device for any subsequent tests.
  await prisma.gpsDevice.update({
    where: { id: gpsDeviceId },
    data: { isActive: true },
  });
});

it("GPS device should not update another bus", async () => {
  const otherBus = await prisma.bus.findFirst({
    where: { id: { not: 1 } },
    select: { id: true },
  });

  if (!otherBus) {
    return; // Skip this scenario when no second bus exists.
  }

  const response = await fetch(
    `${BASE_URL}/api/buses/${otherBus.id}/location`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": gpsApiKey,
      },
      body: JSON.stringify({
        latitude: 22.5726,
        longitude: 88.3639,
        speed: 20,
      }),
    }
  );

  expect(response.status).toBe(403);
});

it("should update lastUsedAt after GPS authentication", async () => {
  await prisma.gpsDevice.update({
    where: { id: gpsDeviceId },
    data: { lastUsedAt: null },
  });

  const response = await fetch(`${BASE_URL}/api/buses/1/location`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": gpsApiKey,
    },
    body: JSON.stringify({
      latitude: 22.5726,
      longitude: 88.3639,
      speed: 20,
    }),
  });

  expect(response.status).toBe(201);

  const device = await prisma.gpsDevice.findUnique({
    where: { id: gpsDeviceId },
    select: { lastUsedAt: true },
  });

  expect(device.lastUsedAt).not.toBeNull();
});
