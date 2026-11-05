
import { prisma } from "../config/database.js";
import { Prisma } from "@prisma/client";

export async function searchTrips({
  from,
  to,
  journeyDate,
  page = 1,
  limit = 20,
}) {
  const offset = (page - 1) * limit;

  // Trip service stores journeyDate at UTC midnight.
  // Search must use the same date convention.
  const startOfDay = new Date(`${journeyDate}T00:00:00.000Z`);

  if (
    Number.isNaN(startOfDay.getTime()) ||
    startOfDay.toISOString().slice(0, 10) !== journeyDate
  ) {
    const error = new Error("Invalid journey date");
    error.statusCode = 400;
    throw error;
  }

  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  const conditions = Prisma.sql`
    t."journeyDate" >= ${startOfDay}
    AND t."journeyDate" < ${endOfDay}
    AND t."status" != 'CANCELLED'
    AND r."isActive" = true
    AND origin_stop."name" ILIKE ${from}
    AND destination_stop."name" ILIKE ${to}
    AND origin_rs."sequence" < destination_rs."sequence"
  `;

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

        origin_stop."id" AS "originId",
        origin_stop."name" AS "originName",

        destination_stop."id" AS "destinationId",
        destination_stop."name" AS "destinationName"

      FROM "Trip" t

      INNER JOIN "Bus" b
        ON b."id" = t."busId"

      INNER JOIN "Route" r
        ON r."id" = t."routeId"

      INNER JOIN "Operator" o
        ON o."id" = r."operatorId"

      INNER JOIN "RouteStop" origin_rs
        ON origin_rs."routeId" = r."id"

      INNER JOIN "Stop" origin_stop
        ON origin_stop."id" = origin_rs."stopId"

      INNER JOIN "RouteStop" destination_rs
        ON destination_rs."routeId" = r."id"

      INNER JOIN "Stop" destination_stop
        ON destination_stop."id" = destination_rs."stopId"

      WHERE ${conditions}

      ORDER BY t."departureTime" ASC, t."id" ASC

      LIMIT ${limit}
      OFFSET ${offset}
    `,

    prisma.$queryRaw`
      SELECT COUNT(*)::int AS total

      FROM "Trip" t

      INNER JOIN "Route" r
        ON r."id" = t."routeId"

      INNER JOIN "RouteStop" origin_rs
        ON origin_rs."routeId" = r."id"

      INNER JOIN "Stop" origin_stop
        ON origin_stop."id" = origin_rs."stopId"

      INNER JOIN "RouteStop" destination_rs
        ON destination_rs."routeId" = r."id"

      INNER JOIN "Stop" destination_stop
        ON destination_stop."id" = destination_rs."stopId"

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
