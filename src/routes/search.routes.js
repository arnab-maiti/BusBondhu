
import { Router } from "express";
import { searchTripsController } from "../controllers/search.controller.js";

const router = Router();

router.get("/", searchTripsController);

export default router;
