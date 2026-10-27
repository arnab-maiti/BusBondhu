import express from "express";
import cors from "cors";
import http from "http";
import process from "node:process";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import rateLimit from "express-rate-limit";
dotenv.config();
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });
const app = express();

import { hashGpsApiKey } from "./utils/gpsKeys.js";

async function requireGpsApiKey(req, res, next) {
  try {
    const providedKey = req.get("x-api-key");

    if (!providedKey) {
      return res.status(401).json({
        success: false,
        message: "GPS API key is required",
      });
    }

    const keyHash = hashGpsApiKey(providedKey);

    const device = await prisma.gpsDevice.findUnique({
      where: { keyHash },
      select: {
        id: true,
        name: true,
        busId: true,
        isActive: true,
      },
    });

    if (!device || !device.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid or inactive GPS device",
      });
    }

    req.gpsDevice = device;

    await prisma.gpsDevice.update({
      where: { id: device.id },
      data: { lastUsedAt: new Date() },
    });

    next();
  } catch (error) {
    console.error("GPS authentication failed:", error);

    return res.status(500).json({
      success: false,
      message: "GPS authentication failed",
    });
  }
}

const gpsLocationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  keyGenerator: (req) => String(req.gpsDevice.id),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many GPS updates. Please try again later.",
  },
});
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "BusBondhu API is running",
  });
});
app.post("/api/buses", async (req, res) => {
  try {
    const { busNumber } = req.body;

    if (!busNumber || !busNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Bus number is required",
      });
    }

    const bus = await prisma.bus.create({
      data: {
        busNumber: busNumber.trim(),
      },
    });

    res.status(201).json({
      success: true,
      data: bus,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This bus number already exists",
      });
    }

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

io.on("connection", (socket) => {
  console.log("Passenger connected:", socket.id);

  socket.on("subscribeToBus", async (rawBusId, callback) => {
    const respond =
      typeof callback === "function" ? callback : () => {};

    try {
      const busId = Number(rawBusId);

      if (!Number.isSafeInteger(busId) || busId <= 0) {
        return respond({
          success: false,
          message: "Invalid bus ID",
        });
      }

      const bus = await prisma.bus.findUnique({
        where: { id: busId },
        select: { id: true },
      });

      if (!bus) {
        return respond({
          success: false,
          message: "Bus not found",
        });
      }

      await socket.join(`bus:${busId}`);

      return respond({
        success: true,
        busId,
        message: "Subscribed to bus updates",
      });
    } catch (error) {
      console.error("Bus subscription failed:", error);

      return respond({
        success: false,
        message: "Unable to subscribe to bus updates",
      });
    }
  });

  socket.on("unsubscribeFromBus", async (rawBusId, callback) => {
    const respond =
      typeof callback === "function" ? callback : () => {};

    const busId = Number(rawBusId);

    if (!Number.isSafeInteger(busId) || busId <= 0) {
      return respond({
        success: false,
        message: "Invalid bus ID",
      });
    }

    await socket.leave(`bus:${busId}`);

    return respond({
      success: true,
      busId,
      message: "Unsubscribed from bus updates",
    });
  });

  socket.on("disconnect", () => {
    console.log("Passenger disconnected:", socket.id);
  });
});


app.post(
  "/api/buses/:id/location",
  requireGpsApiKey,
  gpsLocationLimiter,
  async (req, res) => {
  try {
    const busId = Number(req.params.id);
    if (busId !== req.gpsDevice.busId) {
  return res.status(403).json({
    success: false,
    message: "This GPS device is not authorized for this bus",
  });
}
if (
  !req.body ||
  typeof req.body !== "object" ||
  Array.isArray(req.body)
) {
  return res.status(400).json({
    success: false,
    message: "Request body must be a JSON object",
  });
}

const { latitude, longitude, speed = 0 } = req.body;


    if (!Number.isInteger(busId) || busId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid bus ID",
      });
    }

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180 ||
      typeof speed !== "number" ||
      !Number.isFinite(speed) ||
      speed < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude, longitude, or speed",
      });
    }

    const bus = await prisma.bus.findUnique({
      where: { id: busId },
    });

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    const location = await prisma.busLocation.create({
      data: {
        busId,
        latitude,
        longitude,
        speed,
      },
    });

io.to(`bus:${busId}`).emit("busLocationUpdated", {
  busId,
  busNumber: bus.busNumber,
  latitude: location.latitude,
  longitude: location.longitude,
  speed: location.speed,
  recordedAt: location.recordedAt,
});

    res.status(201).json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

app.get("/api/buses", async (req, res) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }

    const [buses, total] = await Promise.all([
      prisma.bus.findMany({
        orderBy: { busNumber: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          locations: {
            orderBy: { recordedAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.bus.count(),
    ]);

    const data = buses.map(({ locations, ...bus }) => ({
      ...bus,
      latestLocation: locations[0] ?? null,
    }));

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/buses failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve buses",
    });
  }
});

app.get("/api/buses/:id/location", async (req, res) => {
  try {
    const busId = Number(req.params.id);

    if (!Number.isInteger(busId) || busId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid bus ID",
      });
    }

    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      select: {
        id: true,
        busNumber: true,
      },
    });

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    const location = await prisma.busLocation.findFirst({
      where: { busId },
      orderBy: { recordedAt: "desc" },
    });

    if (!location) {
      return res.status(200).json({
        success: true,
        data: {
          bus,
          latestLocation: null,
          trackingStatus: "no_data",
        },
      });
    }

    const ageMs = Date.now() - new Date(location.recordedAt).getTime();
    const trackingStatus =
      ageMs < 0 ? "invalid_timestamp" :
      ageMs <= 60_000 ? "fresh" :
      "stale";

    return res.status(200).json({
      success: true,
      data: {
        bus,
        latestLocation: location,
        trackingStatus,
      },
    });
  } catch (error) {
    console.error("GET bus location failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve bus location",
    });
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`BusBondhu server running on port ${PORT}`);
});