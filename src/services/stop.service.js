import { prisma } from "../config/database.js";

// Create a new stop
export async function createStop({ name, address, latitude, longitude }) {
  return await prisma.stop.create({
    data: {
      name: name.trim(),
      address: address?.trim() || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    },
  });
}
// Get all stops
export async function getStops() {
  return await prisma.stop.findMany({
    orderBy: {
      name: "asc",
    },
  });
}// Get a single stop by ID
export async function getStopById(stopId) {
  return await prisma.stop.findUnique({
    where: {
      id: stopId,
    },
    include: {
      routes: {
        include: {
          route: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
  });
}
// Update an existing stop
export async function updateStop(
  stopId,
  { name, address, latitude, longitude }
) {
  const existingStop = await prisma.stop.findUnique({
    where: { id: stopId },
  });

  if (!existingStop) {
    return null;
  }

  return await prisma.stop.update({
    where: { id: stopId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(address !== undefined && {
        address: address?.trim() || null,
      }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
    },
  });
}