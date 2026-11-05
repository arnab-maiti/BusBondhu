import * as stopService from "../services/stop.service.js";

// POST /api/stops
export async function createStop(req, res) {
  try {
    const { name, address, latitude, longitude } = req.body ?? {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Stop name is required",
      });
    }

    const coordinates = [latitude, longitude];

    if (
      coordinates.some(
        (value) =>
          value !== undefined &&
          value !== null &&
          (typeof value !== "number" || !Number.isFinite(value))
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Coordinates must be valid numbers",
      });
    }

    if (
      latitude !== undefined &&
      latitude !== null &&
      (latitude < -90 || latitude > 90)
    ) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be between -90 and 90",
      });
    }

    if (
      longitude !== undefined &&
      longitude !== null &&
      (longitude < -180 || longitude > 180)
    ) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be between -180 and 180",
      });
    }

    if (
      address !== undefined &&
      address !== null &&
      typeof address !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Address must be a string or null",
      });
    }

    const stop = await stopService.createStop({
      name,
      address,
      latitude,
      longitude,
    });

    return res.status(201).json({
      success: true,
      message: "Stop created successfully",
      data: stop,
    });
  } catch (error) {
    console.error("POST /api/stops failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create stop",
    });
  }
}

// GET /api/stops
export async function getStops(req, res) {
  try {
    const stops = await stopService.getStops();

    return res.status(200).json({
      success: true,
      data: stops,
    });
  } catch (error) {
    console.error("GET /api/stops failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve stops",
    });
  }
}

// GET /api/stops/:id
export async function getStopById(req, res) {
  try {
    const stopId = Number(req.params.id);

    if (!Number.isInteger(stopId) || stopId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid stop ID",
      });
    }

    const stop = await stopService.getStopById(stopId);

    if (!stop) {
      return res.status(404).json({
        success: false,
        message: "Stop not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: stop,
    });
  } catch (error) {
    console.error("GET stop by ID failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve stop",
    });
  }
}

// PATCH /api/stops/:id
export async function updateStop(req, res) {
  try {
    const stopId = Number(req.params.id);
    const { name, address, latitude, longitude } = req.body ?? {};

    if (!Number.isInteger(stopId) || stopId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid stop ID",
      });
    }

    if (
      name === undefined &&
      address === undefined &&
      latitude === undefined &&
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required",
      });
    }

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Stop name cannot be empty",
      });
    }

    if (
      address !== undefined &&
      address !== null &&
      typeof address !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Address must be a string or null",
      });
    }

    if (
      latitude !== undefined &&
      latitude !== null &&
      (typeof latitude !== "number" ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude",
      });
    }

    if (
      longitude !== undefined &&
      longitude !== null &&
      (typeof longitude !== "number" ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid longitude",
      });
    }

    const stop = await stopService.updateStop(stopId, {
      name,
      address,
      latitude,
      longitude,
    });

    if (!stop) {
      return res.status(404).json({
        success: false,
        message: "Stop not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Stop updated successfully",
      data: stop,
    });
  } catch (error) {
    console.error("PATCH stop failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update stop",
    });
  }
}

export default {
  createStop,
  getStops,
  getStopById,
  updateStop,
};
