
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  cancelTrip,
} from "../services/trip.service.js";

const parsePositiveInt = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};

export async function createTripController(req, res) {
  try {
    const {
      busId,
      routeId,
      journeyDate,
      departureTime,
      arrivalTime,
    } = req.body ?? {};

    if (
      !parsePositiveInt(busId) ||
      !parsePositiveInt(routeId) ||
      !journeyDate ||
      !departureTime ||
      !arrivalTime
    ) {
      return res.status(400).json({
        success: false,
        message: "All trip fields are required and IDs must be positive integers",
      });
    }

    const trip = await createTrip({
      busId: Number(busId),
      routeId: Number(routeId),
      journeyDate,
      departureTime,
      arrivalTime,
    });

    return res.status(201).json({
      success: true,
      message: "Trip created successfully",
      data: trip,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to create trip",
    });
  }
}

export async function getTripsController(req, res) {
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
        message: "Invalid pagination parameters",
      });
    }

    const { journeyDate, busId, routeId, operatorId, status } = req.query;

    for (const id of [busId, routeId, operatorId]) {
      if (id !== undefined && !parsePositiveInt(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid filter ID",
        });
      }
    }

    const validStatuses = [
      "SCHEDULED",
      "BOARDING",
      "DEPARTED",
      "COMPLETED",
      "CANCELLED",
      "DELAYED",
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip status",
      });
    }

    const result = await getTrips({
      page,
      limit,
      journeyDate,
      busId: busId ? Number(busId) : undefined,
      routeId: routeId ? Number(routeId) : undefined,
      operatorId: operatorId ? Number(operatorId) : undefined,
      status,
    });

    return res.status(200).json({
      success: true,
      message: "Trips fetched successfully",
      ...result,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch trips",
    });
  }
}

export async function getTripByIdController(req, res) {
  try {
    const tripId = parsePositiveInt(req.params.id);

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip ID",
      });
    }

    const trip = await getTripById(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: trip,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch trip",
    });
  }
}

export async function updateTripController(req, res) {
  try {
    const tripId = parsePositiveInt(req.params.id);

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip ID",
      });
    }

    const allowedFields = [
      "busId",
      "routeId",
      "journeyDate",
      "departureTime",
      "arrivalTime",
    ];

    const data = {};

    for (const field of allowedFields) {
      if (req.body?.[field] !== undefined) {
        data[field] = req.body[field];
      }
    }

    if (!Object.keys(data).length) {
      return res.status(400).json({
        success: false,
        message: "At least one valid field is required",
      });
    }

    for (const field of ["busId", "routeId"]) {
      if (
        data[field] !== undefined &&
        !parsePositiveInt(data[field])
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field}`,
        });
      }

      if (data[field] !== undefined) {
        data[field] = Number(data[field]);
      }
    }

    const trip = await updateTrip(tripId, data);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Trip updated successfully",
      data: trip,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to update trip",
    });
  }
}

export async function cancelTripController(req, res) {
  try {
    const tripId = parsePositiveInt(req.params.id);

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: "Invalid trip ID",
      });
    }

    const trip = await cancelTrip(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Trip cancelled successfully",
      data: trip,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to cancel trip",
    });
  }
}
