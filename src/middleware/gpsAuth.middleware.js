import { hashGpsApiKey } from "../utils/gpsKeys.js";
import { prisma } from "../config/database.js";

export async function requireGpsApiKey(req, res, next) {
  try {
    const providedKey = req.get("x-api-key");

    if (!providedKey) {
      return res.status(401).json({
        success: false,
        message: "GPS API key is required",
      });
    }

    const keyHash = hashGpsApiKey(providedKey);

    const device = await prisma.gpsDevice.findUnique({
      where: { keyHash },
      select: {
        id: true,
        name: true,
        busId: true,
        isActive: true,
      },
    });

    if (!device || !device.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid or inactive GPS device",
      });
    }

    req.gpsDevice = device;

    await prisma.gpsDevice.update({
      where: { id: device.id },
      data: { lastUsedAt: new Date() },
    });

    next();
  } catch (error) {
    console.error("GPS authentication failed:", error);

    return res.status(500).json({
      success: false,
      message: "GPS authentication failed",
    });
  }
}

export default requireGpsApiKey;
