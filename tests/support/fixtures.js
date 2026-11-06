import { assertTestDatabaseIdentity } from "./database-safety.js";

export const FIXTURE_SEARCH_DATE = "2026-12-15";
export const FIXTURE_NEXT_DATE = "2026-12-16";

export const OPERATOR_MAIN_ID = 940001;
export const OPERATOR_OTHER_ID = 940002;

export const GPS_BUS_ID = 940101;

const operators = [
  {
    id: OPERATOR_MAIN_ID,
    name: "Fixture Operator Main",
    description: "Deterministic search fixture operator",
  },
  {
    id: OPERATOR_OTHER_ID,
    name: "Fixture Operator Other",
    description: "Deterministic secondary fixture operator",
  },
];

const buses = [
  {
    id: GPS_BUS_ID,
    busNumber: "FIXTURE-GPS-001",
    operatorId: OPERATOR_MAIN_ID,
  },
  {
    id: 940102,
    busNumber: "FIXTURE-MAIN-002",
    operatorId: OPERATOR_MAIN_ID,
  },
  {
    id: 940103,
    busNumber: "FIXTURE-MAIN-003",
    operatorId: OPERATOR_MAIN_ID,
  },
  {
    id: 940104,
    busNumber: "FIXTURE-TIE-004",
    operatorId: OPERATOR_MAIN_ID,
  },
  {
    id: 940105,
    busNumber: "FIXTURE-INACTIVE-005",
    operatorId: OPERATOR_MAIN_ID,
  },
  {
    id: 940106,
    busNumber: "FIXTURE-OTHER-006",
    operatorId: OPERATOR_OTHER_ID,
  },
  {
    id: 940107,
    busNumber: "FIXTURE-NEXT-DATE-007",
    operatorId: OPERATOR_MAIN_ID,
  },
];

const stops = [
  {
    id: 940201,
    name: "Fixture Alpha Terminal",
    address: "Fixture address alpha",
  },
  {
    id: 940202,
    name: "Fixture Beta Junction",
    address: "Fixture address beta",
  },
  {
    id: 940203,
    name: "Fixture Shared Stop",
    address: "Fixture shared early",
  },
  {
    id: 940204,
    name: "Fixture Shared Stop",
    address: "Fixture shared late",
  },
  {
    id: 940205,
    name: "Fixture Gamma Point",
    address: "Fixture address gamma",
  },
  {
    id: 940206,
    name: "Fixture Delta Depot",
    address: "Fixture stop not assigned to a route",
  },
  {
    id: 940207,
    name: "Fixture Other Origin",
    address: "Fixture other origin",
  },
  {
    id: 940208,
    name: "Fixture Other Destination",
    address: "Fixture other destination",
  },
];

const routes = [
  {
    id: 940301,
    name: "Fixture Main Route",
    code: "FIXTURE-MAIN",
    isActive: true,
    operatorId: OPERATOR_MAIN_ID,
  },
  {
    id: 940302,
    name: "Fixture Inactive Route",
    code: "FIXTURE-INACTIVE",
    isActive: false,
    operatorId: OPERATOR_MAIN_ID,
  },
  {
    id: 940303,
    name: "Fixture Other Route",
    code: "FIXTURE-OTHER",
    isActive: true,
    operatorId: OPERATOR_OTHER_ID,
  },
];

const routeStops = [
  { id: 940501, routeId: 940301, stopId: 940201, sequence: 1 },
  { id: 940502, routeId: 940301, stopId: 940203, sequence: 2 },
  { id: 940503, routeId: 940301, stopId: 940202, sequence: 3 },
  { id: 940504, routeId: 940301, stopId: 940204, sequence: 4 },
  { id: 940505, routeId: 940301, stopId: 940205, sequence: 5 },
  { id: 940506, routeId: 940302, stopId: 940201, sequence: 1 },
  { id: 940507, routeId: 940302, stopId: 940202, sequence: 2 },
  { id: 940508, routeId: 940303, stopId: 940207, sequence: 1 },
  { id: 940509, routeId: 940303, stopId: 940208, sequence: 2 },
];

function trip({
  id,
  busId,
  routeId,
  journeyDate,
  departureTime,
  arrivalTime,
  status = "SCHEDULED",
}) {
  return {
    id,
    busId,
    routeId,
    journeyDate: new Date(`${journeyDate}T00:00:00.000Z`),
    departureTime: new Date(departureTime),
    arrivalTime: new Date(arrivalTime),
    status,
  };
}

const trips = [
  trip({
    id: 940401,
    busId: GPS_BUS_ID,
    routeId: 940301,
    journeyDate: FIXTURE_SEARCH_DATE,
    departureTime: "2026-12-15T03:30:00.000Z",
    arrivalTime: "2026-12-15T07:30:00.000Z",
  }),
  trip({
    id: 940402,
    busId: 940102,
    routeId: 940301,
    journeyDate: FIXTURE_SEARCH_DATE,
    departureTime: "2026-12-15T02:30:00.000Z",
    arrivalTime: "2026-12-15T06:30:00.000Z",
    status: "BOARDING",
  }),
  trip({
    id: 940403,
    busId: 940103,
    routeId: 940301,
    journeyDate: FIXTURE_SEARCH_DATE,
    departureTime: "2026-12-15T07:30:00.000Z",
    arrivalTime: "2026-12-15T11:30:00.000Z",
    status: "CANCELLED",
  }),
  trip({
    id: 940404,
    busId: 940104,
    routeId: 940301,
    journeyDate: FIXTURE_SEARCH_DATE,
    departureTime: "2026-12-15T03:30:00.000Z",
    arrivalTime: "2026-12-15T07:30:00.000Z",
  }),
  trip({
    id: 940405,
    busId: GPS_BUS_ID,
    routeId: 940301,
    journeyDate: FIXTURE_SEARCH_DATE,
    departureTime: "2026-12-15T08:00:00.000Z",
    arrivalTime: "2026-12-15T12:00:00.000Z",
    status: "DEPARTED",
  }),
  trip({
    id: 940406,
    busId: 940105,
    routeId: 940302,
    journeyDate: FIXTURE_SEARCH_DATE,
    departureTime: "2026-12-15T09:00:00.000Z",
    arrivalTime: "2026-12-15T12:30:00.000Z",
  }),
  trip({
    id: 940407,
    busId: 940106,
    routeId: 940303,
    journeyDate: FIXTURE_SEARCH_DATE,
    departureTime: "2026-12-15T01:00:00.000Z",
    arrivalTime: "2026-12-15T04:00:00.000Z",
  }),
  trip({
    id: 940408,
    busId: 940107,
    routeId: 940301,
    journeyDate: FIXTURE_NEXT_DATE,
    departureTime: "2026-12-16T03:30:00.000Z",
    arrivalTime: "2026-12-16T07:30:00.000Z",
  }),
];

const operatorIds = operators.map((item) => item.id);
const busIds = buses.map((item) => item.id);
const busNumbers = buses.map((item) => item.busNumber);
const stopIds = stops.map((item) => item.id);
const stopNames = [...new Set(stops.map((item) => item.name))];
const routeIds = routes.map((item) => item.id);
const routeCodes = routes.map((item) => item.code);
const routeStopIds = routeStops.map((item) => item.id);
const tripIds = trips.map((item) => item.id);

export const MAIN_TRIP_IDS_IN_ORDER = [
  940402,
  940401,
  940404,
  940405,
];

export const CANCELLED_TRIP_ID = 940403;
export const INACTIVE_ROUTE_TRIP_ID = 940406;
export const OTHER_ROUTE_TRIP_ID = 940407;
export const NEXT_DATE_TRIP_ID = 940408;

export async function resetFixtures(prisma) {
  await assertTestDatabaseIdentity(prisma);

  // Every delete is constrained to the fixed fixture IDs and their
  // stable unique values. No broad table-wide deletion is performed.
  await prisma.trip.deleteMany({
    where: {
      id: { in: tripIds },
      routeId: { in: routeIds },
      busId: { in: busIds },
    },
  });

  await prisma.routeStop.deleteMany({
    where: {
      id: { in: routeStopIds },
      routeId: { in: routeIds },
    },
  });

  await prisma.route.deleteMany({
    where: {
      id: { in: routeIds },
      code: { in: routeCodes },
    },
  });

  await prisma.bus.deleteMany({
    where: {
      id: { in: busIds },
      busNumber: { in: busNumbers },
    },
  });

  await prisma.stop.deleteMany({
    where: {
      id: { in: stopIds },
      name: { in: stopNames },
    },
  });

  await prisma.operator.deleteMany({
    where: {
      id: { in: operatorIds },
      name: {
        in: operators.map((item) => item.name),
      },
    },
  });
}

export async function seedFixtures(prisma) {
  await prisma.operator.createMany({ data: operators });
  await prisma.bus.createMany({ data: buses });
  await prisma.stop.createMany({ data: stops });
  await prisma.route.createMany({ data: routes });
  await prisma.routeStop.createMany({ data: routeStops });
  await prisma.trip.createMany({ data: trips });
}
