import { prisma } from "../config/database.js";

export async function createBus({ busNumber }) {
  return await prisma.bus.create({
    data: {
      busNumber: busNumber.trim(),
    },
  });
}

export async function getBuses({ page = 1, limit = 20 }) {
  const [buses, total] = await Promise.all([
    prisma.bus.findMany({
      orderBy: { busNumber: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        locations: {
          orderBy: { recordedAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.bus.count(),
  ]);

  const data = buses.map(({ locations, ...bus }) => ({
    ...bus,
    latestLocation: locations[0] ?? null,
  }));

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getBusLocation(busId) {
  const bus = await prisma.bus.findUnique({
    where: { id: busId },
    select: {
      id: true,
      busNumber: true,
    },
  });

  if (!bus) {
    return null;
  }

  const location = await prisma.busLocation.findFirst({
    where: { busId },
    orderBy: { recordedAt: "desc" },
  });

  if (!location) {
    return {
      bus,
      latestLocation: null,
      trackingStatus: "no_data",
    };
  }

  const ageMs = Date.now() - new Date(location.recordedAt).getTime();
  const trackingStatus =
    ageMs < 0
      ? "invalid_timestamp"
      : ageMs <= 60_000
        ? "fresh"
        : "stale";

  return {
    bus,
    latestLocation: location,
    trackingStatus,
  };
}

export async function createBusLocation({ busId, latitude, longitude, speed = 0 }) {
  const bus = await prisma.bus.findUnique({
    where: { id: busId },
  });

  if (!bus) {
    return null;
  }

  const location = await prisma.busLocation.create({
    data: {
      busId,
      latitude,
      longitude,
      speed,
    },
  });

  return {
    bus,
    location,
  };
}

export default {
  createBus,
  getBuses,
  getBusLocation,
  createBusLocation,
};
