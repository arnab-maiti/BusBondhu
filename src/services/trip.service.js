
import { prisma } from "../config/database.js";

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Store journeyDate as UTC midnight: YYYY-MM-DD.
function parseJourneyDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw createServiceError(
      "journeyDate must use YYYY-MM-DD format",
      400
    );
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw createServiceError("Invalid journey date", 400);
  }

  return date;
}

// Require an explicit timezone, such as +05:30 or Z.
function parseDateTime(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw createServiceError(`${fieldName} is required`, 400);
  }

  if (!/(Z|[+-]\d{2}:\d{2})$/i.test(value)) {
    throw createServiceError(
      `${fieldName} must include a timezone, e.g. +05:30`,
      400
    );
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw createServiceError(`Invalid ${fieldName}`, 400);
  }

  return date;
}

// journeyDate represents the calendar date in Kolkata.
function validateJourneyDateMatchesDeparture(journeyDate, departureTime) {
  const departureDate = departureTime.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  if (journeyDate.toISOString().slice(0, 10) !== departureDate) {
    throw createServiceError(
      "Journey date must match departure date in Asia/Kolkata",
      400
    );
  }
}

function validateTripTimes(journeyDate, departureTime, arrivalTime) {
  if (departureTime >= arrivalTime) {
    throw createServiceError(
      "Arrival must be after departure",
      400
    );
  }

  validateJourneyDateMatchesDeparture(journeyDate, departureTime);
}

async function lockBus(tx, busId) {
  const result = await tx.$queryRaw`
    SELECT "id"
    FROM "Bus"
    WHERE "id" = ${busId}
    FOR UPDATE
  `;

  if (result.length === 0) {
    throw createServiceError("Bus not found", 404);
  }
}

async function validateBusAndRoute(tx, busId, routeId) {
  const [bus, route] = await Promise.all([
    tx.bus.findUnique({
      where: { id: busId },
      select: { id: true, operatorId: true },
    }),
    tx.route.findUnique({
      where: { id: routeId },
      select: {
        id: true,
        operatorId: true,
        isActive: true,
      },
    }),
  ]);

  if (!bus) {
    throw createServiceError("Bus not found", 404);
  }

  if (!route) {
    throw createServiceError("Route not found", 404);
  }

  if (!route.isActive) {
    throw createServiceError("Route is inactive", 400);
  }

  if (bus.operatorId !== route.operatorId) {
    throw createServiceError(
      "Bus and route operators do not match",
      400
    );
  }

  return { bus, route };
}

async function findBusTripConflict(
  tx,
  busId,
  departureTime,
  arrivalTime,
  excludeTripId
) {
  return tx.trip.findFirst({
    where: {
      busId,
      ...(excludeTripId !== undefined && {
        id: { not: excludeTripId },
      }),
      status: { not: "CANCELLED" },
      departureTime: { lt: arrivalTime },
      arrivalTime: { gt: departureTime },
    },
    select: { id: true },
  });
}

// Create a new trip.
export async function createTrip({
  busId,
  routeId,
  journeyDate,
  departureTime,
  arrivalTime,
}) {
  const date = parseJourneyDate(journeyDate);
  const start = parseDateTime(departureTime, "departureTime");
  const end = parseDateTime(arrivalTime, "arrivalTime");

  validateTripTimes(date, start, end);

  return prisma.$transaction(
    async (tx) => {
      // Every trip creation for this bus must acquire this lock.
      await lockBus(tx, busId);

      await validateBusAndRoute(tx, busId, routeId);

      const conflict = await findBusTripConflict(
        tx,
        busId,
        start,
        end
      );

      if (conflict) {
        throw createServiceError(
          "Bus already has a conflicting trip",
          409
        );
      }

      return tx.trip.create({
        data: {
          busId,
          routeId,
          journeyDate: date,
          departureTime: start,
          arrivalTime: end,
        },
        include: {
          bus: {
            select: {
              id: true,
              busNumber: true,
            },
          },
          route: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );
}

// Get trips with pagination and filters.
export async function getTrips({
  page = 1,
  limit = 20,
  journeyDate,
  busId,
  routeId,
  operatorId,
  status,
}) {
  const date = journeyDate
    ? parseJourneyDate(journeyDate)
    : null;

  const where = {
    ...(date && {
      journeyDate: {
        gte: date,
        lt: new Date(date.getTime() + 86400000),
      },
    }),
    ...(busId && { busId }),
    ...(routeId && { routeId }),
    ...(operatorId && {
      route: { operatorId },
    }),
    ...(status && { status }),
  };

  const [trips, total] = await prisma.$transaction([
    prisma.trip.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { journeyDate: "asc" },
        { departureTime: "asc" },
        { id: "asc" },
      ],
      include: {
        bus: {
          select: {
            id: true,
            busNumber: true,
          },
        },
        route: {
          select: {
            id: true,
            name: true,
            code: true,
            operator: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.trip.count({ where }),
  ]);

  return {
    trips,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Get a single trip by ID.
export async function getTripById(tripId) {
  return prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      bus: {
        select: {
          id: true,
          busNumber: true,
        },
      },
      route: {
        include: {
          operator: {
            select: {
              id: true,
              name: true,
            },
          },
          stops: {
            orderBy: { sequence: "asc" },
            include: {
              stop: true,
            },
          },
        },
      },
    },
  });
}

// Update an existing trip safely.
export async function updateTrip(tripId, data) {
  return prisma.$transaction(
    async (tx) => {
      // Lock the trip first to serialize concurrent updates.
      const lockedTrip = await tx.$queryRaw`
        SELECT "id"
        FROM "Trip"
        WHERE "id" = ${tripId}
        FOR UPDATE
      `;

      if (lockedTrip.length === 0) {
        return null;
      }

      const existing = await tx.trip.findUnique({
        where: { id: tripId },
      });

      if (!existing) {
        return null;
      }

      if (
        ["DEPARTED", "COMPLETED", "CANCELLED"].includes(
          existing.status
        )
      ) {
        throw createServiceError(
          "This trip cannot be updated",
          400
        );
      }

      const busId = data.busId ?? existing.busId;
      const routeId = data.routeId ?? existing.routeId;

      const departureTime =
        data.departureTime !== undefined
          ? parseDateTime(data.departureTime, "departureTime")
          : existing.departureTime;

      const arrivalTime =
        data.arrivalTime !== undefined
          ? parseDateTime(data.arrivalTime, "arrivalTime")
          : existing.arrivalTime;

      const journeyDate =
        data.journeyDate !== undefined
          ? parseJourneyDate(data.journeyDate)
          : existing.journeyDate;

      validateTripTimes(
        journeyDate,
        departureTime,
        arrivalTime
      );

      // Lock the target bus before checking conflicts.
      await lockBus(tx, busId);

      await validateBusAndRoute(tx, busId, routeId);

      const conflict = await findBusTripConflict(
        tx,
        busId,
        departureTime,
        arrivalTime,
        tripId
      );

      if (conflict) {
        throw createServiceError(
          "Bus already has a conflicting trip",
          409
        );
      }

      return tx.trip.update({
        where: { id: tripId },
        data: {
          busId,
          routeId,
          journeyDate,
          departureTime,
          arrivalTime,
        },
        include: {
          bus: {
            select: {
              id: true,
              busNumber: true,
            },
          },
          route: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );
}

// Cancel a trip safely.
export async function cancelTrip(tripId) {
  return prisma.$transaction(
    async (tx) => {
      const lockedTrip = await tx.$queryRaw`
        SELECT "id"
        FROM "Trip"
        WHERE "id" = ${tripId}
        FOR UPDATE
      `;

      if (lockedTrip.length === 0) {
        return null;
      }

      const trip = await tx.trip.findUnique({
        where: { id: tripId },
      });

      if (!trip) {
        return null;
      }

      if (
        trip.status === "DEPARTED" ||
        trip.status === "COMPLETED"
      ) {
        throw createServiceError(
          "Departed or completed trip cannot be cancelled",
          400
        );
      }

      if (trip.status === "CANCELLED") {
        return trip;
      }

      return tx.trip.update({
        where: { id: tripId },
        data: { status: "CANCELLED" },
      });
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );
}
