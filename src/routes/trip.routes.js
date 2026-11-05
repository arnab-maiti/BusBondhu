
import { Router } from "express";
import {
  createTripController,
  getTripsController,
  getTripByIdController,
  updateTripController,
  cancelTripController,
} from "../controllers/trip.controller.js";

const router = Router();

router.post("/", createTripController);
router.get("/", getTripsController);
router.get("/:id", getTripByIdController);
router.patch("/:id", updateTripController);
router.patch("/:id/cancel", cancelTripController);

export default router;
