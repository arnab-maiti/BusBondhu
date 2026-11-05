
import { searchTrips } from "../services/search.service.js";

export async function searchTripsController(req, res) {
  try {
    const { from, to, journeyDate } = req.query;

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (
      !from ||
      !to ||
      !journeyDate ||
      typeof from !== "string" ||
      typeof to !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Origin, destination and journey date are required",
      });
    }

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

    if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "Origin and destination cannot be the same",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(journeyDate)) {
      return res.status(400).json({
        success: false,
        message: "Journey date must use YYYY-MM-DD format",
      });
    }

    const date = new Date(`${journeyDate}T00:00:00+05:30`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== journeyDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid journey date",
      });
    }

    const result = await searchTrips({
      from: from.trim(),
      to: to.trim(),
      journeyDate,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Trip search completed",
      ...result,
    });
  } catch (error) {
    console.error("Trip search error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search trips",
    });
  }
}
