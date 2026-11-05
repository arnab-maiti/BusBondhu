import * as operatorService from "../services/operator.service.js";

export async function createOperator(req, res) {
  try {
    const { name, description, contact } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Operator name is required",
      });
    }

    const operator = await operatorService.createOperator({
      name,
      description,
      contact,
    });

    return res.status(201).json({
      success: true,
      message: "Operator created successfully",
      data: operator,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Operator already exists",
      });
    }

    console.error("POST /api/operators failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create operator",
    });
  }
}

export async function getOperators(req, res) {
  try {
    const operators = await operatorService.getOperators();

    return res.status(200).json({
      success: true,
      data: operators,
    });
  } catch (error) {
    console.error("GET /api/operators failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve operators",
    });
  }
}

export async function getOperatorById(req, res) {
  try {
    const operatorId = Number(req.params.id);

    if (!Number.isInteger(operatorId) || operatorId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid operator ID",
      });
    }

    const operator = await operatorService.getOperatorById(operatorId);

    if (!operator) {
      return res.status(404).json({
        success: false,
        message: "Operator not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: operator,
    });
  } catch (error) {
    console.error("GET operator by ID failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve operator",
    });
  }
}

export async function updateOperator(req, res) {
  try {
    const operatorId = Number(req.params.id);
    const { name, description, contact } = req.body;

    if (!Number.isInteger(operatorId) || operatorId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid operator ID",
      });
    }

    if (
      name === undefined &&
      description === undefined &&
      contact === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required",
      });
    }

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return res.status(400).json({
        success: false,
        message: "Operator name cannot be empty",
      });
    }

    const operator = await operatorService.updateOperator(operatorId, {
      name,
      description,
      contact,
    });

    if (!operator) {
      return res.status(404).json({
        success: false,
        message: "Operator not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Operator updated successfully",
      data: operator,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Operator name already exists",
      });
    }

    console.error("PATCH operator failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update operator",
    });
  }
}

export default {
  createOperator,
  getOperators,
  getOperatorById,
  updateOperator,
};
