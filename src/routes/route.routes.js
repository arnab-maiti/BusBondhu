import { Router } from "express";
import * as routeController from "../controllers/route.controller.js";

const router = Router();

router.post("/", routeController.createRoute);
router.get("/", routeController.getRoutes);
router.get("/:id", routeController.getRouteById);
router.patch("/:id", routeController.updateRoute);
// Route–Stop relationship APIs
router.post("/:id/stops", routeController.addStopToRoute);

router.get("/:id/stops", routeController.getRouteStops);

router.patch(
  "/:id/stops/:stopId",
  routeController.updateRouteStopSequence
);

router.delete(
  "/:id/stops/:stopId",
  routeController.removeStopFromRoute
);
export default router;