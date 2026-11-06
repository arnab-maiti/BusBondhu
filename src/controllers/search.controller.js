import { searchTrips } from "../services/search.service.js";

function parsePositiveInteger(value, defaultValue, max) {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed < 1 ||
    (max !== undefined && parsed > max)
  ) {
    return null;
  }

  return parsed;
}

export async function searchTripsController(req, res) {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 20, 100);

    if (page === null || limit === null) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }

    const result = await searchTrips({
      from: req.query.from,
      to: req.query.to,
      fromStopId: req.query.fromStopId,
      toStopId: req.query.toStopId,
      journeyDate: req.query.journeyDate,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Trip search completed",
      ...result,
    });
  } catch (error) {
    if (
      Number.isInteger(error?.statusCode) &&
      error.statusCode >= 400 &&
      error.statusCode < 500
    ) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Trip search error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search trips",
    });
  }
}
