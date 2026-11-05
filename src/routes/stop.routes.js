import { Router } from "express";
import * as stopController from "../controllers/stop.controller.js";

const router = Router();

router.post("/", stopController.createStop);
router.get("/", stopController.getStops);
router.get("/:id", stopController.getStopById);
router.patch("/:id", stopController.updateStop);

export default router;