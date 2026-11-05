import { Router } from "express";
import * as operatorController from "../controllers/operator.controller.js";

const router = Router();

router.post("/", operatorController.createOperator);
router.get("/", operatorController.getOperators);
router.get("/:id", operatorController.getOperatorById);
router.patch("/:id", operatorController.updateOperator);

export default router;
