import * as busService from "../services/bus.service.js";
import { broadcastBusLocation } from "../sockets/bus.socket.js";

export async function createBus(req, res) {
  try {
    const { busNumber } = req.body;

    if (!busNumber || !busNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Bus number is required",
      });
    }

    const bus = await busService.createBus({ busNumber });

    return res.status(201).json({
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

    console.error("POST /api/buses failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function getBuses(req, res) {
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

    const result = await busService.getBuses({ page, limit });

    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    console.error("GET /api/buses failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve buses",
    });
  }
}

export async function getBusLocation(req, res) {
  try {
    const busId = Number(req.params.id);

    if (!Number.isInteger(busId) || busId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid bus ID",
      });
    }

    const result = await busService.getBusLocation(busId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("GET bus location failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve bus location",
    });
  }
}

export async function recordBusLocation(req, res) {
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

    const result = await busService.createBusLocation({
      busId,
      latitude,
      longitude,
      speed,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Bus not found",
      });
    }

    const io = req.app.get("io");
    if (io) {
      broadcastBusLocation(io, {
        busId,
        busNumber: result.bus.busNumber,
        latitude: result.location.latitude,
        longitude: result.location.longitude,
        speed: result.location.speed,
        recordedAt: result.location.recordedAt,
      });
    }

    return res.status(201).json({
      success: true,
      data: result.location,
    });
  } catch (error) {
    console.error("POST /api/buses/:id/location failed:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export default {
  createBus,
  getBuses,
  getBusLocation,
  recordBusLocation,
};
