import { prisma } from "../config/database.js";
import { Prisma } from "@prisma/client";

function createServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeStopName(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw createServiceError(`${fieldName} must be a string`, 400);
  }

  const name = value.trim();

  if (!name) {
    throw createServiceError(`${fieldName} cannot be empty`, 400);
  }

  if (name.length > 200) {
    throw createServiceError(`${fieldName} is too long`, 400);
  }

  return name;
}

function parseStopId(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const id = Number(value);

    if (Number.isSafeInteger(id) && id > 0) {
      return id;
    }
  }

  if (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  ) {
    return value;
  }

  throw createServiceError(`Invalid ${fieldName}`, 400);
}

function parseJourneyDateRange(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw createServiceError(
      "Journey date must use YYYY-MM-DD format",
      400
    );
  }

  // Trip service stores journeyDate at UTC midnight.
  // Search must use the same date convention.
  const startOfDay = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(startOfDay.getTime()) ||
    startOfDay.toISOString().slice(0, 10) !== value
  ) {
    throw createServiceError("Invalid journey date", 400);
  }

  return {
    startOfDay,
    endOfDay: new Date(startOfDay.getTime() + 86400000),
  };
}

async function validateStopFilters({
  from,
  to,
  fromStopId,
  toStopId,
}) {
  if (from === undefined && fromStopId === undefined) {
    throw createServiceError(
      "Origin is required (from or fromStopId)",
      400
    );
  }

  if (to === undefined && toStopId === undefined) {
    throw createServiceError(
      "Destination is required (to or toStopId)",
      400
    );
  }

  if (
    from !== undefined &&
    to !== undefined &&
    fromStopId === undefined &&
    toStopId === undefined &&
    from.toLowerCase() === to.toLowerCase()
  ) {
    throw createServiceError(
      "Origin and destination cannot be the same",
      400
    );
  }

  if (
    fromStopId !== undefined &&
    toStopId !== undefined &&
    fromStopId === toStopId
  ) {
    throw createServiceError(
      "Origin and destination cannot be the same stop",
      400
    );
  }

  const requestedStops = [];

  if (fromStopId !== undefined) {
    requestedStops.push({
      fieldName: "fromStopId",
      id: fromStopId,
      name: from,
    });
  }

  if (toStopId !== undefined) {
    requestedStops.push({
      fieldName: "toStopId",
      id: toStopId,
      name: to,
    });
  }

  if (requestedStops.length === 0) {
    return;
  }

  const stops = await prisma.stop.findMany({
    where: {
      id: {
        in: requestedStops.map((item) => item.id),
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const stopsById = new Map(
    stops.map((stop) => [stop.id, stop])
  );

  for (const item of requestedStops) {
    const stop = stopsById.get(item.id);

    if (!stop) {
      throw createServiceError(`Invalid ${item.fieldName}`, 400);
    }

    if (
      item.name !== undefined &&
      stop.name.trim().toLowerCase() !== item.name.toLowerCase()
    ) {
      throw createServiceError(
        `${item.fieldName} does not match the provided stop name`,
        400
      );
    }
  }
}

export async function searchTrips({
  from: rawFrom,
  to: rawTo,
  fromStopId: rawFromStopId,
  toStopId: rawToStopId,
  journeyDate,
  page = 1,
  limit = 20,
}) {
  const from = normalizeStopName(rawFrom, "from");
  const to = normalizeStopName(rawTo, "to");
  const fromStopId = parseStopId(rawFromStopId, "fromStopId");
  const toStopId = parseStopId(rawToStopId, "toStopId");

  const { startOfDay, endOfDay } =
    parseJourneyDateRange(journeyDate);

  await validateStopFilters({
    from,
    to,
    fromStopId,
    toStopId,
  });

  const offset = (page - 1) * limit;

  if (!Number.isSafeInteger(offset)) {
    throw createServiceError("Invalid pagination parameters", 400);
  }

  // Match the requested stop either by its explicit ID or by an
  // exact, case-insensitive name. Using lower() instead of ILIKE
  // keeps % and _ literal instead of treating them as wildcards.
  const originPredicate =
    fromStopId !== undefined
      ? Prisma.sql`origin_rs."stopId" = ${fromStopId}`
      : Prisma.sql`lower(origin_stop."name") = lower(${from})`;

  const destinationPredicate =
    toStopId !== undefined
      ? Prisma.sql`destination_rs."stopId" = ${toStopId}`
      : Prisma.sql`lower(destination_stop."name") = lower(${to})`;

  const conditions = Prisma.sql`
    t."journeyDate" >= ${startOfDay}
    AND t."journeyDate" < ${endOfDay}
    AND t."status" != 'CANCELLED'
    AND r."isActive" = true
    AND b."operatorId" = r."operatorId"
  `;

  // One lateral subquery per side guarantees at most one origin and
  // one destination row per trip, so repeated stop names cannot
  // duplicate results or inflate the count.
  const [trips, countResult] = await prisma.$transaction([
    prisma.$queryRaw`
      SELECT
        t."id" AS "tripId",
        t."departureTime",
        t."arrivalTime",
        t."status",

        b."id" AS "busId",
        b."busNumber",

        r."id" AS "routeId",
        r."name" AS "routeName",
        r."code" AS "routeCode",

        o."id" AS "operatorId",
        o."name" AS "operatorName",

        origin."stopId" AS "originId",
        origin."name" AS "originName",

        destination."stopId" AS "destinationId",
        destination."name" AS "destinationName"

      FROM "Trip" t

      INNER JOIN "Bus" b
        ON b."id" = t."busId"

      INNER JOIN "Route" r
        ON r."id" = t."routeId"

      INNER JOIN "Operator" o
        ON o."id" = r."operatorId"

      INNER JOIN LATERAL (
        SELECT
          origin_rs."stopId",
          origin_rs."sequence",
          origin_stop."name"
        FROM "RouteStop" origin_rs
        INNER JOIN "Stop" origin_stop
          ON origin_stop."id" = origin_rs."stopId"
        WHERE origin_rs."routeId" = r."id"
          AND ${originPredicate}
        ORDER BY origin_rs."sequence" ASC
        LIMIT 1
      ) origin ON true

      INNER JOIN LATERAL (
        SELECT
          destination_rs."stopId",
          destination_rs."sequence",
          destination_stop."name"
        FROM "RouteStop" destination_rs
        INNER JOIN "Stop" destination_stop
          ON destination_stop."id" = destination_rs."stopId"
        WHERE destination_rs."routeId" = r."id"
          AND destination_rs."sequence" > origin."sequence"
          AND ${destinationPredicate}
        ORDER BY destination_rs."sequence" ASC
        LIMIT 1
      ) destination ON true

      WHERE ${conditions}

      ORDER BY t."departureTime" ASC, t."id" ASC

      LIMIT ${limit}
      OFFSET ${offset}
    `,

    prisma.$queryRaw`
      SELECT COUNT(*)::int AS total

      FROM "Trip" t

      INNER JOIN "Bus" b
        ON b."id" = t."busId"

      INNER JOIN "Route" r
        ON r."id" = t."routeId"

      INNER JOIN LATERAL (
        SELECT
          origin_rs."stopId",
          origin_rs."sequence",
          origin_stop."name"
        FROM "RouteStop" origin_rs
        INNER JOIN "Stop" origin_stop
          ON origin_stop."id" = origin_rs."stopId"
        WHERE origin_rs."routeId" = r."id"
          AND ${originPredicate}
        ORDER BY origin_rs."sequence" ASC
        LIMIT 1
      ) origin ON true

      INNER JOIN LATERAL (
        SELECT
          destination_rs."stopId",
          destination_rs."sequence",
          destination_stop."name"
        FROM "RouteStop" destination_rs
        INNER JOIN "Stop" destination_stop
          ON destination_stop."id" = destination_rs."stopId"
        WHERE destination_rs."routeId" = r."id"
          AND destination_rs."sequence" > origin."sequence"
          AND ${destinationPredicate}
        ORDER BY destination_rs."sequence" ASC
        LIMIT 1
      ) destination ON true

      WHERE ${conditions}
    `,
  ]);

  const total = Number(countResult[0]?.total ?? 0);

  return {
    trips: trips.map((trip) => ({
      tripId: trip.tripId,
      bus: {
        id: trip.busId,
        busNumber: trip.busNumber,
      },
      operator: {
        id: trip.operatorId,
        name: trip.operatorName,
      },
      route: {
        id: trip.routeId,
        name: trip.routeName,
        code: trip.routeCode,
      },
      origin: {
        id: trip.originId,
        name: trip.originName,
      },
      destination: {
        id: trip.destinationId,
        name: trip.destinationName,
      },
      departureTime: trip.departureTime,
      arrivalTime: trip.arrivalTime,
      status: trip.status,
    })),

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
