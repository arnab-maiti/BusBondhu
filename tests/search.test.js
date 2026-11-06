import { beforeAll, describe, expect, it, inject } from "vitest";
import {
  CANCELLED_TRIP_ID,
  FIXTURE_NEXT_DATE,
  FIXTURE_SEARCH_DATE,
  INACTIVE_ROUTE_TRIP_ID,
  MAIN_TRIP_IDS_IN_ORDER,
  NEXT_DATE_TRIP_ID,
  OTHER_ROUTE_TRIP_ID,
} from "./support/fixtures.js";

let BASE_URL;

beforeAll(() => {
  BASE_URL = inject("apiBaseUrl");
});

async function search(query) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }

  const response = await fetch(
    `${BASE_URL}/api/search?${params.toString()}`
  );

  return {
    response,
    body: await response.json(),
  };
}

function tripIds(body) {
  return body.trips.map((trip) => trip.tripId);
}

const MAIN_SEARCH = {
  from: "Fixture Alpha Terminal",
  to: "Fixture Beta Junction",
  journeyDate: FIXTURE_SEARCH_DATE,
};

describe("Passenger search integration", () => {
  it("returns successful results for a name-based search", async () => {
    const { response, body } = await search(MAIN_SEARCH);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe("Trip search completed");
    expect(body.trips).toHaveLength(4);
    expect(tripIds(body)).toEqual(MAIN_TRIP_IDS_IN_ORDER);

    expect(body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 4,
      totalPages: 1,
    });

    const firstTrip = body.trips[0];

    expect(firstTrip.bus.busNumber).toBe("FIXTURE-MAIN-002");
    expect(firstTrip.operator.name).toBe("Fixture Operator Main");
    expect(firstTrip.route.code).toBe("FIXTURE-MAIN");
    expect(firstTrip.origin).toEqual({
      id: 940201,
      name: "Fixture Alpha Terminal",
    });
    expect(firstTrip.destination).toEqual({
      id: 940202,
      name: "Fixture Beta Junction",
    });
    expect(firstTrip.status).toBe("BOARDING");
  });

  it("matches names case-insensitively and trims whitespace", async () => {
    const { response, body } = await search({
      from: "  fixture ALPHA terminal  ",
      to: "FIXTURE beta junction",
      journeyDate: FIXTURE_SEARCH_DATE,
    });

    expect(response.status).toBe(200);
    expect(body.pagination.total).toBe(4);
    expect(tripIds(body)).toEqual(MAIN_TRIP_IDS_IN_ORDER);
  });

  it("returns one row per trip when stop names are duplicated", async () => {
    const { response, body } = await search({
      from: "Fixture Shared Stop",
      to: "Fixture Gamma Point",
      journeyDate: FIXTURE_SEARCH_DATE,
    });

    expect(response.status).toBe(200);
    expect(body.trips).toHaveLength(4);
    expect(new Set(tripIds(body)).size).toBe(4);
    expect(body.pagination.total).toBe(4);
    expect(body.pagination.totalPages).toBe(1);

    for (const trip of body.trips) {
      expect(trip.origin.id).toBe(940203);
      expect(trip.origin.name).toBe("Fixture Shared Stop");
      expect(trip.destination.id).toBe(940205);
    }
  });

  it("selects stops by route sequence and rejects reverse order", async () => {
    const forward = await search({
      from: "Fixture Alpha Terminal",
      to: "Fixture Shared Stop",
      journeyDate: FIXTURE_SEARCH_DATE,
    });

    expect(forward.response.status).toBe(200);
    expect(forward.body.pagination.total).toBe(4);
    expect(
      forward.body.trips.every(
        (trip) => trip.destination.id === 940203
      )
    ).toBe(true);

    const reverse = await search({
      from: "Fixture Beta Junction",
      to: "Fixture Alpha Terminal",
      journeyDate: FIXTURE_SEARCH_DATE,
    });

    expect(reverse.response.status).toBe(200);
    expect(reverse.body.trips).toEqual([]);
    expect(reverse.body.pagination.total).toBe(0);

    const reverseById = await search({
      fromStopId: 940202,
      toStopId: 940201,
      journeyDate: FIXTURE_SEARCH_DATE,
    });

    expect(reverseById.response.status).toBe(200);
    expect(reverseById.body.pagination.total).toBe(0);
  });

  it("supports valid stop IDs and mixed name/ID searches", async () => {
    const byIds = await search({
      fromStopId: 940201,
      toStopId: 940202,
      journeyDate: FIXTURE_SEARCH_DATE,
    });

    expect(byIds.response.status).toBe(200);
    expect(byIds.body.pagination.total).toBe(4);
    expect(tripIds(byIds.body)).toEqual(MAIN_TRIP_IDS_IN_ORDER);

    for (const trip of byIds.body.trips) {
      expect(trip.origin.id).toBe(940201);
      expect(trip.destination.id).toBe(940202);
    }

    const mixed = await search({
      fromStopId: 940201,
      to: "Fixture Beta Junction",
      journeyDate: FIXTURE_SEARCH_DATE,
    });

    expect(mixed.response.status).toBe(200);
    expect(mixed.body.pagination.total).toBe(4);

    const validIdNotOnRoute = await search({
      fromStopId: 940206,
      toStopId: 940202,
      journeyDate: FIXTURE_SEARCH_DATE,
    });

    expect(validIdNotOnRoute.response.status).toBe(200);
    expect(validIdNotOnRoute.body.trips).toEqual([]);
    expect(validIdNotOnRoute.body.pagination.total).toBe(0);
  });

  it("treats a supplied stop ID as authoritative with name checks", async () => {
    const matching = await search({
      from: "Fixture Alpha Terminal",
      fromStopId: 940201,
      to: "Fixture Beta Junction",
      toStopId: 940202,
      journeyDate: FIXTURE_SEARCH_DATE,
    });

    expect(matching.response.status).toBe(200);
    expect(matching.body.pagination.total).toBe(4);

    const duplicateNamesWithDistinctIds = await search({
      from: "Fixture Shared Stop",
      fromStopId: 940203,
      to: "Fixture Shared Stop",
      toStopId: 940204,
      journeyDate: FIXTURE_SEARCH_DATE,
    });

    expect(duplicateNamesWithDistinctIds.response.status).toBe(200);
    expect(duplicateNamesWithDistinctIds.body.pagination.total).toBe(4);

    for (const trip of duplicateNamesWithDistinctIds.body.trips) {
      expect(trip.origin.id).toBe(940203);
      expect(trip.destination.id).toBe(940204);
    }

    const mismatch = await search({
      from: "Fixture Beta Junction",
      fromStopId: 940201,
      to: "Fixture Beta Junction",
      journeyDate: FIXTURE_SEARCH_DATE,
    });

    expect(mismatch.response.status).toBe(400);
    expect(mismatch.body.message).toBe(
      "fromStopId does not match the provided stop name"
    );
  });

  it("excludes cancelled trips, inactive routes and other dates", async () => {
    const { response, body } = await search(MAIN_SEARCH);

    expect(response.status).toBe(200);
    expect(body.pagination.total).toBe(4);
    expect(tripIds(body)).not.toContain(CANCELLED_TRIP_ID);
    expect(tripIds(body)).not.toContain(INACTIVE_ROUTE_TRIP_ID);
    expect(tripIds(body)).not.toContain(NEXT_DATE_TRIP_ID);
    expect(tripIds(body)).not.toContain(OTHER_ROUTE_TRIP_ID);
    expect(
      body.trips.every((trip) => trip.status !== "CANCELLED")
    ).toBe(true);

    const nextDay = await search({
      from: "Fixture Alpha Terminal",
      to: "Fixture Beta Junction",
      journeyDate: FIXTURE_NEXT_DATE,
    });

    expect(nextDay.response.status).toBe(200);
    expect(tripIds(nextDay.body)).toEqual([NEXT_DATE_TRIP_ID]);
    expect(nextDay.body.pagination.total).toBe(1);

    const emptyDay = await search({
      from: "Fixture Alpha Terminal",
      to: "Fixture Beta Junction",
      journeyDate: "2026-12-14",
    });

    expect(emptyDay.response.status).toBe(200);
    expect(emptyDay.body.pagination.total).toBe(0);
  });

  it("returns results from another active route independently", async () => {
    const { response, body } = await search({
      from: "Fixture Other Origin",
      to: "Fixture Other Destination",
      journeyDate: FIXTURE_SEARCH_DATE,
    });

    expect(response.status).toBe(200);
    expect(tripIds(body)).toEqual([OTHER_ROUTE_TRIP_ID]);
    expect(body.pagination.total).toBe(1);
    expect(body.trips[0].route.code).toBe("FIXTURE-OTHER");
    expect(body.trips[0].operator.name).toBe(
      "Fixture Operator Other"
    );
  });

  it("paginates with accurate totals and boundaries", async () => {
    const pageOne = await search({
      ...MAIN_SEARCH,
      limit: 2,
      page: 1,
    });

    expect(pageOne.response.status).toBe(200);
    expect(tripIds(pageOne.body)).toEqual([940402, 940401]);
    expect(pageOne.body.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 4,
      totalPages: 2,
    });

    const pageTwo = await search({
      ...MAIN_SEARCH,
      limit: 2,
      page: 2,
    });

    expect(tripIds(pageTwo.body)).toEqual([940404, 940405]);
    expect(pageTwo.body.pagination.total).toBe(4);

    const pageThree = await search({
      ...MAIN_SEARCH,
      limit: 2,
      page: 3,
    });

    expect(pageThree.response.status).toBe(200);
    expect(pageThree.body.trips).toEqual([]);
    expect(pageThree.body.pagination).toEqual({
      page: 3,
      limit: 2,
      total: 4,
      totalPages: 2,
    });

    const singlePage = await search({
      ...MAIN_SEARCH,
      limit: 100,
      page: 1,
    });

    expect(singlePage.body.pagination.total).toBe(4);
    expect(singlePage.body.pagination.totalPages).toBe(1);
    expect(tripIds(singlePage.body)).toEqual(MAIN_TRIP_IDS_IN_ORDER);
  });

  it("keeps stable ordering for equal departure times", async () => {
    const { body } = await search({
      ...MAIN_SEARCH,
      limit: 100,
    });

    const ids = tripIds(body);
    expect(ids.indexOf(940401)).toBeLessThan(ids.indexOf(940404));
    expect(ids).toEqual(MAIN_TRIP_IDS_IN_ORDER);
  });

  it("treats percent and underscore as literal stop names", async () => {
    const percent = await search({
      from: "%",
      to: "Fixture Beta Junction",
      journeyDate: FIXTURE_SEARCH_DATE,
    });

    const underscore = await search({
      from: "_",
      to: "Fixture Beta Junction",
      journeyDate: FIXTURE_SEARCH_DATE,
    });

    expect(percent.response.status).toBe(200);
    expect(percent.body.pagination.total).toBe(0);
    expect(underscore.response.status).toBe(200);
    expect(underscore.body.pagination.total).toBe(0);
  });

  it("validates dates, names, IDs and pagination", async () => {
    const cases = [
      {
        query: { ...MAIN_SEARCH, page: 0 },
        message: "Invalid pagination parameters",
      },
      {
        query: { ...MAIN_SEARCH, page: "1.5" },
        message: "Invalid pagination parameters",
      },
      {
        query: { ...MAIN_SEARCH, limit: 101 },
        message: "Invalid pagination parameters",
      },
      {
        query: {
          from: "Fixture Alpha Terminal",
          to: "Fixture Beta Junction",
          journeyDate: "2026-02-30",
        },
        message: "Invalid journey date",
      },
      {
        query: {
          from: "Fixture Alpha Terminal",
          to: "Fixture Beta Junction",
          journeyDate: "15-12-2026",
        },
        message: "Journey date must use YYYY-MM-DD format",
      },
      {
        query: {
          from: "   ",
          to: "Fixture Beta Junction",
          journeyDate: FIXTURE_SEARCH_DATE,
        },
        message: "from cannot be empty",
      },
      {
        query: {
          from: "Fixture Alpha Terminal",
          to: "Fixture Alpha Terminal",
          journeyDate: FIXTURE_SEARCH_DATE,
        },
        message: "Origin and destination cannot be the same",
      },
      {
        query: {
          fromStopId: "not-a-number",
          to: "Fixture Beta Junction",
          journeyDate: FIXTURE_SEARCH_DATE,
        },
        message: "Invalid fromStopId",
      },
      {
        query: {
          fromStopId: 999999,
          toStopId: 940202,
          journeyDate: FIXTURE_SEARCH_DATE,
        },
        message: "Invalid fromStopId",
      },
    ];

    for (const testCase of cases) {
      const { response, body } = await search(testCase.query);

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.message).toBe(testCase.message);
    }
  });
});
