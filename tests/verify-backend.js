import http from "node:http";
import process from "node:process";
import { Server } from "socket.io";
import { io as ClientIo } from "socket.io-client";
import dotenv from "dotenv";
import app from "../src/app.js";
import { initBusSocket } from "../src/sockets/bus.socket.js";
import { prisma } from "../src/config/database.js";
import { generateGpsApiKey, hashGpsApiKey } from "../src/utils/gpsKeys.js";

dotenv.config();

const TEST_PORT = 5055;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runVerification() {
  console.log("=== BusBondhu Backend Phase 1 Verification ===");

  // 1. Start Server on test port
  console.log("\n1. Starting HTTP server & Socket.IO...");
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });
  app.set("io", io);
  initBusSocket(io);

  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`✓ Server running at ${BASE_URL}`);

  let testOperatorId = null;
  let testBusId = null;
  let testGpsDeviceId = null;
  let socketClient = null;

  try {
    // 2. Health endpoint check
    console.log("\n2. Testing GET /api/health...");
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    if (healthRes.status !== 200 || !healthData.success) {
      throw new Error(`Health check failed: ${JSON.stringify(healthData)}`);
    }
    console.log(`✓ GET /api/health passed: "${healthData.message}"`);

    // 3. Operator Endpoints
    console.log("\n3. Testing Operator CRUD Endpoints...");
    // 3a. POST /api/operators (validation error)
    const opEmptyRes = await fetch(`${BASE_URL}/api/operators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    if (opEmptyRes.status !== 400) {
      throw new Error(`Expected 400 for empty operator name, got ${opEmptyRes.status}`);
    }
    console.log("✓ POST /api/operators rejects empty name with 400");

    // 3b. POST /api/operators (create success)
    const uniqueOpName = `Test Express ${Date.now()}`;
    const opCreateRes = await fetch(`${BASE_URL}/api/operators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: uniqueOpName,
        description: "Public transit operator in Bengal",
        contact: "contact@testexpress.wb.gov.in",
      }),
    });
    const opCreateData = await opCreateRes.json();
    if (opCreateRes.status !== 201 || !opCreateData.success) {
      throw new Error(`Create operator failed: ${JSON.stringify(opCreateData)}`);
    }
    testOperatorId = opCreateData.data.id;
    console.log(`✓ POST /api/operators created operator ID ${testOperatorId}: "${opCreateData.data.name}"`);

    // 3c. POST /api/operators (conflict error)
    const opDupRes = await fetch(`${BASE_URL}/api/operators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: uniqueOpName }),
    });
    if (opDupRes.status !== 409) {
      throw new Error(`Expected 409 for duplicate operator, got ${opDupRes.status}`);
    }
    console.log("✓ POST /api/operators returns 409 for duplicate operator name");

    // 3d. GET /api/operators (list)
    const opListRes = await fetch(`${BASE_URL}/api/operators`);
    const opListData = await opListRes.json();
    if (opListRes.status !== 200 || !Array.isArray(opListData.data)) {
      throw new Error(`List operators failed: ${JSON.stringify(opListData)}`);
    }
    const foundOp = opListData.data.find((o) => o.id === testOperatorId);
    if (!foundOp) {
      throw new Error(`Created operator ${testOperatorId} not found in list`);
    }
    console.log(`✓ GET /api/operators returned ${opListData.data.length} operators`);

    // 3e. GET /api/operators/:id
    const opGetRes = await fetch(`${BASE_URL}/api/operators/${testOperatorId}`);
    const opGetData = await opGetRes.json();
    if (opGetRes.status !== 200 || opGetData.data.id !== testOperatorId) {
      throw new Error(`Get operator by ID failed: ${JSON.stringify(opGetData)}`);
    }
    console.log(`✓ GET /api/operators/:id returned operator with ${opGetData.data.buses.length} buses`);

    // 3f. PATCH /api/operators/:id
    const opPatchRes = await fetch(`${BASE_URL}/api/operators/${testOperatorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "Updated transit description" }),
    });
    const opPatchData = await opPatchRes.json();
    if (opPatchRes.status !== 200 || opPatchData.data.description !== "Updated transit description") {
      throw new Error(`Update operator failed: ${JSON.stringify(opPatchData)}`);
    }
    console.log("✓ PATCH /api/operators/:id updated operator successfully");

    // 4. Bus Endpoints
    console.log("\n4. Testing Bus Endpoints...");
    // 4a. POST /api/buses (validation error)
    const busEmptyRes = await fetch(`${BASE_URL}/api/buses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ busNumber: "" }),
    });
    if (busEmptyRes.status !== 400) {
      throw new Error(`Expected 400 for empty busNumber, got ${busEmptyRes.status}`);
    }
    console.log("✓ POST /api/buses rejects empty busNumber with 400");

    // 4b. POST /api/buses (create success)
    const uniqueBusNumber = `WB-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;
    const busCreateRes = await fetch(`${BASE_URL}/api/buses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ busNumber: uniqueBusNumber }),
    });
    const busCreateData = await busCreateRes.json();
    if (busCreateRes.status !== 201 || !busCreateData.success) {
      throw new Error(`Create bus failed: ${JSON.stringify(busCreateData)}`);
    }
    testBusId = busCreateData.data.id;
    console.log(`✓ POST /api/buses created bus ID ${testBusId}: "${busCreateData.data.busNumber}"`);

    // 4c. POST /api/buses (duplicate conflict)
    const busDupRes = await fetch(`${BASE_URL}/api/buses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ busNumber: uniqueBusNumber }),
    });
    if (busDupRes.status !== 409) {
      throw new Error(`Expected 409 for duplicate busNumber, got ${busDupRes.status}`);
    }
    console.log("✓ POST /api/buses returns 409 for duplicate busNumber");

    // 4d. GET /api/buses with pagination
    const busPageRes = await fetch(`${BASE_URL}/api/buses?page=1&limit=5`);
    const busPageData = await busPageRes.json();
    if (busPageRes.status !== 200 || !busPageData.pagination || busPageData.pagination.page !== 1) {
      throw new Error(`Get buses pagination failed: ${JSON.stringify(busPageData)}`);
    }
    console.log(`✓ GET /api/buses returned paginated list (total: ${busPageData.pagination.total}, page: 1, limit: 5)`);

    // 4e. GET /api/buses?page=0 (pagination validation)
    const busInvalidPageRes = await fetch(`${BASE_URL}/api/buses?page=0`);
    if (busInvalidPageRes.status !== 400) {
      throw new Error(`Expected 400 for page=0, got ${busInvalidPageRes.status}`);
    }
    console.log("✓ GET /api/buses rejects page=0 with 400");

    // 5. GPS Authentication, Authorization & Location Reporting
    console.log("\n5. Testing GPS Authentication & Authorization...");
    const testGpsApiKey = generateGpsApiKey();
    const gpsDevice = await prisma.gpsDevice.create({
      data: {
        name: "Verification GPS Device",
        keyHash: hashGpsApiKey(testGpsApiKey),
        busId: testBusId,
        isActive: true,
      },
    });
    testGpsDeviceId = gpsDevice.id;
    console.log(`✓ Created test GPS device ID ${testGpsDeviceId} for Bus ID ${testBusId}`);

    // 5a. POST location without API key -> 401
    const noKeyRes = await fetch(`${BASE_URL}/api/buses/${testBusId}/location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: 22.5726, longitude: 88.3639, speed: 25 }),
    });
    if (noKeyRes.status !== 401) {
      throw new Error(`Expected 401 for missing key, got ${noKeyRes.status}`);
    }
    console.log("✓ POST location rejects missing API key with 401");

    // 5b. POST location with invalid key -> 401
    const invalidKeyRes = await fetch(`${BASE_URL}/api/buses/${testBusId}/location`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "invalid-key-test-12345",
      },
      body: JSON.stringify({ latitude: 22.5726, longitude: 88.3639, speed: 25 }),
    });
    if (invalidKeyRes.status !== 401) {
      throw new Error(`Expected 401 for invalid key, got ${invalidKeyRes.status}`);
    }
    console.log("✓ POST location rejects invalid API key with 401");

    // 5c. POST location with inactive device -> 401
    await prisma.gpsDevice.update({
      where: { id: testGpsDeviceId },
      data: { isActive: false },
    });
    const inactiveRes = await fetch(`${BASE_URL}/api/buses/${testBusId}/location`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": testGpsApiKey,
      },
      body: JSON.stringify({ latitude: 22.5726, longitude: 88.3639, speed: 25 }),
    });
    if (inactiveRes.status !== 401) {
      throw new Error(`Expected 401 for inactive device, got ${inactiveRes.status}`);
    }
    console.log("✓ POST location rejects inactive GPS device with 401");

    // Reactivate device
    await prisma.gpsDevice.update({
      where: { id: testGpsDeviceId },
      data: { isActive: true },
    });

    // 5d. POST location to an unassigned bus -> 403
    const otherBusRes = await fetch(`${BASE_URL}/api/buses/999999/location`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": testGpsApiKey,
      },
      body: JSON.stringify({ latitude: 22.5726, longitude: 88.3639, speed: 25 }),
    });
    if (otherBusRes.status !== 403) {
      throw new Error(`Expected 403 for unauthorized bus, got ${otherBusRes.status}`);
    }
    console.log("✓ POST location returns 403 when updating an unassigned bus");

    // 6. Socket.IO & Real-time Location Updates
    console.log("\n6. Testing Socket.IO Subscription & Broadcast...");
    socketClient = ClientIo(BASE_URL, { reconnection: false });
    await new Promise((resolve, reject) => {
      socketClient.on("connect", resolve);
      socketClient.on("connect_error", reject);
    });
    console.log(`✓ Socket.IO passenger connected: ${socketClient.id}`);

    // Subscribe to test bus
    const subResult = await new Promise((resolve) => {
      socketClient.emit("subscribeToBus", testBusId, (res) => resolve(res));
    });
    if (!subResult || !subResult.success) {
      throw new Error(`Socket subscribe failed: ${JSON.stringify(subResult)}`);
    }
    console.log(`✓ Subscribed to bus:${testBusId} updates`);

    // Listen for busLocationUpdated event
    const locationPromise = new Promise((resolve) => {
      socketClient.on("busLocationUpdated", (data) => resolve(data));
    });

    // 5e. POST location with valid key -> 201
    const postLocRes = await fetch(`${BASE_URL}/api/buses/${testBusId}/location`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": testGpsApiKey,
      },
      body: JSON.stringify({
        latitude: 22.5726,
        longitude: 88.3639,
        speed: 38.5,
      }),
    });
    const postLocData = await postLocRes.json();
    if (postLocRes.status !== 201 || !postLocData.success) {
      throw new Error(`POST location failed: ${JSON.stringify(postLocData)}`);
    }
    console.log(`✓ POST /api/buses/:id/location recorded location at [${postLocData.data.latitude}, ${postLocData.data.longitude}]`);

    // Verify broadcast was received
    const receivedBroadcast = await Promise.race([
      locationPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Broadcast timeout")), 3000)),
    ]);
    if (receivedBroadcast.busId !== testBusId || receivedBroadcast.speed !== 38.5) {
      throw new Error(`Unexpected broadcast payload: ${JSON.stringify(receivedBroadcast)}`);
    }
    console.log(`✓ Real-time 'busLocationUpdated' broadcast received:`, receivedBroadcast);

    // Unsubscribe
    const unsubResult = await new Promise((resolve) => {
      socketClient.emit("unsubscribeFromBus", testBusId, (res) => resolve(res));
    });
    if (!unsubResult || !unsubResult.success) {
      throw new Error(`Socket unsubscribe failed: ${JSON.stringify(unsubResult)}`);
    }
    console.log(`✓ Unsubscribed from bus:${testBusId}`);

    // 7. Latest Bus Location Endpoint
    console.log("\n7. Testing GET /api/buses/:id/location...");
    const getLocRes = await fetch(`${BASE_URL}/api/buses/${testBusId}/location`);
    const getLocData = await getLocRes.json();
    if (
      getLocRes.status !== 200 ||
      !getLocData.success ||
      getLocData.data.trackingStatus !== "fresh" ||
      !getLocData.data.latestLocation
    ) {
      throw new Error(`Get latest location failed: ${JSON.stringify(getLocData)}`);
    }
    console.log(`✓ GET /api/buses/:id/location returned trackingStatus: "${getLocData.data.trackingStatus}"`);

    // 8. GPS Rate Limiting
    console.log("\n8. Testing GPS Rate Limiting (60 requests/min limit)...");
    const rateLimitApiKey = generateGpsApiKey();
    const rateLimitDevice = await prisma.gpsDevice.create({
      data: {
        name: "Rate Limit Test Device",
        keyHash: hashGpsApiKey(rateLimitApiKey),
        busId: testBusId,
      },
    });

    try {
      const requests = Array.from({ length: 65 }, () =>
        fetch(`${BASE_URL}/api/buses/${testBusId}/location`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": rateLimitApiKey,
          },
          body: JSON.stringify({
            latitude: 22.5726,
            longitude: 88.3639,
            speed: 20,
          }),
        })
      );

      const responses = await Promise.all(requests);
      const statuses = responses.map((r) => r.status);
      const has429 = statuses.includes(429);
      if (!has429) {
        throw new Error(`Expected at least one 429 response out of 65 requests, got: ${statuses.slice(0, 10).join(",")}`);
      }
      console.log(`✓ GPS Rate Limiter triggered 429 Too Many Requests as expected`);
    } finally {
      await prisma.gpsDevice.delete({ where: { id: rateLimitDevice.id } });
    }

    console.log("\n========================================================");
    console.log("🎉 ALL TESTS PASSED! Modular architecture fully verified.");
    console.log("========================================================");
  } finally {
    // Cleanup resources
    console.log("\nCleaning up test fixtures...");
    if (socketClient) {
      socketClient.disconnect();
    }
    if (testGpsDeviceId) {
      await prisma.gpsDevice.deleteMany({ where: { id: testGpsDeviceId } });
    }
    if (testBusId) {
      await prisma.busLocation.deleteMany({ where: { busId: testBusId } });
      await prisma.bus.deleteMany({ where: { id: testBusId } });
    }
    if (testOperatorId) {
      await prisma.operator.deleteMany({ where: { id: testOperatorId } });
    }

    await prisma.$disconnect();
    server.close();
    console.log("✓ Cleanup completed.");
  }
}

runVerification().catch((err) => {
  console.error("\n❌ Verification failed:", err);
  process.exit(1);
});
