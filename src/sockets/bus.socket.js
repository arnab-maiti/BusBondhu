import { prisma } from "../config/database.js";

export function initBusSocket(io) {
  io.on("connection", (socket) => {
    console.log("Passenger connected:", socket.id);

    socket.on("subscribeToBus", async (rawBusId, callback) => {
      const respond =
        typeof callback === "function" ? callback : () => {};

      try {
        const busId = Number(rawBusId);

        if (!Number.isSafeInteger(busId) || busId <= 0) {
          return respond({
            success: false,
            message: "Invalid bus ID",
          });
        }

        const bus = await prisma.bus.findUnique({
          where: { id: busId },
          select: { id: true },
        });

        if (!bus) {
          return respond({
            success: false,
            message: "Bus not found",
          });
        }

        await socket.join(`bus:${busId}`);

        return respond({
          success: true,
          busId,
          message: "Subscribed to bus updates",
        });
      } catch (error) {
        console.error("Bus subscription failed:", error);

        return respond({
          success: false,
          message: "Unable to subscribe to bus updates",
        });
      }
    });

    socket.on("unsubscribeFromBus", async (rawBusId, callback) => {
      const respond =
        typeof callback === "function" ? callback : () => {};

      const busId = Number(rawBusId);

      if (!Number.isSafeInteger(busId) || busId <= 0) {
        return respond({
          success: false,
          message: "Invalid bus ID",
        });
      }

      await socket.leave(`bus:${busId}`);

      return respond({
        success: true,
        busId,
        message: "Unsubscribed from bus updates",
      });
    });

    socket.on("disconnect", () => {
      console.log("Passenger disconnected:", socket.id);
    });
  });
}

export function broadcastBusLocation(io, { busId, busNumber, latitude, longitude, speed, recordedAt }) {
  if (!io) return;
  io.to(`bus:${busId}`).emit("busLocationUpdated", {
    busId,
    busNumber,
    latitude,
    longitude,
    speed,
    recordedAt,
  });
}

export default initBusSocket;
