import { prisma } from "../config/database.js";

// Create a new route
export async function createRoute({
  name,
  code,
  description,
  operatorId,
}) {
  return await prisma.route.create({
    data: {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || null,
      operatorId,
    },
    include: {
      operator: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

// Get all routes
export async function getRoutes() {
  return await prisma.route.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      operator: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          stops: true,
        },
      },
    },
  });
}

// Get a single route by ID
export async function getRouteById(routeId) {
  return await prisma.route.findUnique({
    where: {
      id: routeId,
    },
    include: {
      operator: {
        select: {
          id: true,
          name: true,
        },
      },
      stops: {
        orderBy: {
          sequence: "asc",
        },
        include: {
          stop: true,
        },
      },
    },
  });
}

// Update an existing route
export async function updateRoute(
  routeId,
  { name, code, description, operatorId, isActive }
) {
  const existingRoute = await prisma.route.findUnique({
    where: {
      id: routeId,
    },
  });

  if (!existingRoute) {
    return null;
  }

  return await prisma.route.update({
    where: {
      id: routeId,
    },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(code !== undefined && {
        code: code.trim().toUpperCase(),
      }),
      ...(description !== undefined && {
        description: description?.trim() || null,
      }),
      ...(operatorId !== undefined && { operatorId }),
      ...(isActive !== undefined && { isActive }),
    },
  });
}

// Add a stop to a route
export async function addStopToRoute(routeId, stopId, sequence) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: { id: true },
  });

  if (!route) {
    return { notFound: "route", message: "Route not found" };
  }

  const stop = await prisma.stop.findUnique({
    where: { id: stopId },
    select: { id: true },
  });

  if (!stop) {
    return { notFound: "stop", message: "Stop not found" };
  }

  const existingStop = await prisma.routeStop.findUnique({
    where: {
      routeId_stopId: {
        routeId,
        stopId,
      },
    },
  });

  if (existingStop) {
    return {
      conflict: "stop",
      message: "Stop is already added to this route",
    };
  }

  const existingSequence = await prisma.routeStop.findUnique({
    where: {
      routeId_sequence: {
        routeId,
        sequence,
      },
    },
  });

  if (existingSequence) {
    return {
      conflict: "sequence",
      message: "Sequence number already exists in this route",
    };
  }

  const created = await prisma.routeStop.create({
    data: {
      routeId,
      stopId,
      sequence,
    },
    include: {
      stop: true,
    },
  });

  return { data: created };
}

// Get all stops of a route in sequence
export async function getRouteStops(routeId) {
  return await prisma.routeStop.findMany({
    where: {
      routeId,
    },
    orderBy: {
      sequence: "asc",
    },
    include: {
      stop: true,
    },
  });
}

// Update a stop's sequence within a route using atomic safe reordering
export async function updateRouteStopSequence(routeId, stopId, sequence) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: { id: true },
  });

  if (!route) {
    return { notFound: "route", message: "Route not found" };
  }

  const stop = await prisma.stop.findUnique({
    where: { id: stopId },
    select: { id: true },
  });

  if (!stop) {
    return { notFound: "stop", message: "Stop not found" };
  }

  return await prisma.$transaction(async (tx) => {
    const existingRouteStop = await tx.routeStop.findUnique({
      where: {
        routeId_stopId: {
          routeId,
          stopId,
        },
      },
      include: {
        stop: true,
      },
    });

    if (!existingRouteStop) {
      return {
        notFound: "route_stop",
        message: "Stop not found in this route",
      };
    }

    if (existingRouteStop.sequence === sequence) {
      return { data: existingRouteStop };
    }

    const allStops = await tx.routeStop.findMany({
      where: { routeId },
      orderBy: { sequence: "asc" },
    });

    const oldSeq = existingRouteStop.sequence;
    const newSeq = sequence;
    const updates = [];

    if (newSeq < oldSeq) {
      // Shifting towards beginning: stops in [newSeq, oldSeq - 1] shift +1
      for (const s of allStops) {
        if (s.stopId === stopId) {
          updates.push({ id: s.id, newSequence: newSeq });
        } else if (s.sequence >= newSeq && s.sequence < oldSeq) {
          updates.push({ id: s.id, newSequence: s.sequence + 1 });
        }
      }
    } else {
      // Shifting towards end: stops in [oldSeq + 1, newSeq] shift -1
      for (const s of allStops) {
        if (s.stopId === stopId) {
          updates.push({ id: s.id, newSequence: newSeq });
        } else if (s.sequence > oldSeq && s.sequence <= newSeq) {
          updates.push({ id: s.id, newSequence: s.sequence - 1 });
        }
      }
    }

    // Phase 1: Set temporary unique negative sequence to avoid @@unique([routeId, sequence]) collision
    for (const item of updates) {
      await tx.routeStop.update({
        where: { id: item.id },
        data: { sequence: -item.id },
      });
    }

    // Phase 2: Set target sequence numbers
    for (const item of updates) {
      await tx.routeStop.update({
        where: { id: item.id },
        data: { sequence: item.newSequence },
      });
    }

    const updated = await tx.routeStop.findUnique({
      where: {
        routeId_stopId: {
          routeId,
          stopId,
        },
      },
      include: {
        stop: true,
      },
    });

    return { data: updated };
  });
}

// Remove a stop from a route
export async function removeStopFromRoute(routeId, stopId) {
  const route = await prisma.route.findUnique({
    where: { id: routeId },
    select: { id: true },
  });

  if (!route) {
    return { notFound: "route", message: "Route not found" };
  }

  const stop = await prisma.stop.findUnique({
    where: { id: stopId },
    select: { id: true },
  });

  if (!stop) {
    return { notFound: "stop", message: "Stop not found" };
  }

  const routeStop = await prisma.routeStop.findUnique({
    where: {
      routeId_stopId: {
        routeId,
        stopId,
      },
    },
    select: { id: true },
  });

  if (!routeStop) {
    return {
      notFound: "route_stop",
      message: "Stop not found in this route",
    };
  }

  await prisma.routeStop.delete({
    where: {
      routeId_stopId: {
        routeId,
        stopId,
      },
    },
  });

  return { success: true };
}

export default {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  addStopToRoute,
  getRouteStops,
  updateRouteStopSequence,
  removeStopFromRoute,
};
