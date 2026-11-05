import { Router } from "express";
import * as busController from "../controllers/bus.controller.js";
import { requireGpsApiKey } from "../middleware/gpsAuth.middleware.js";
import { gpsLocationLimiter } from "../middleware/gpsRateLimit.middleware.js";

const router = Router();

router.post("/", busController.createBus);
router.get("/", busController.getBuses);
router.get("/:id/location", busController.getBusLocation);
router.post(
  "/:id/location",
  requireGpsApiKey,
  gpsLocationLimiter,
  busController.recordBusLocation
);

export default router;
