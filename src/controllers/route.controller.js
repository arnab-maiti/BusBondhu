import * as routeService from "../services/route.service.js";

// POST /api/routes
export async function createRoute(req, res) {
  try {
    const { name, code, description, operatorId } = req.body ?? {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Route name is required",
      });
    }

    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Route code is required",
      });
    }

    if (!Number.isInteger(operatorId) || operatorId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid operator ID is required",
      });
    }

    const route = await routeService.createRoute({
      name,
      code,
      description,
      operatorId,
    });

    return res.status(201).json({
      success: true,
      message: "Route created successfully",
      data: route,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Route code already exists",
      });
    }

    if (error.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Invalid operator ID",
      });
    }

    console.error("POST /api/routes failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create route",
    });
  }
}

// GET /api/routes
export async function getRoutes(req, res) {
  try {
    const routes = await routeService.getRoutes();

    return res.status(200).json({
      success: true,
      data: routes,
    });
  } catch (error) {
    console.error("GET /api/routes failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve routes",
    });
  }
}

// GET /api/routes/:id
export async function getRouteById(req, res) {
  try {
    const routeId = Number(req.params.id);

    if (!Number.isInteger(routeId) || routeId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid route ID",
      });
    }

    const route = await routeService.getRouteById(routeId);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: route,
    });
  } catch (error) {
    console.error("GET route by ID failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve route",
    });
  }
}

// PATCH /api/routes/:id
export async function updateRoute(req, res) {
  try {
    const routeId = Number(req.params.id);

    const {
      name,
      code,
      description,
      operatorId,
      isActive,
    } = req.body ?? {};

    if (!Number.isInteger(routeId) || routeId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid route ID",
      });
    }

    if (
      name === undefined &&
      code === undefined &&
      description === undefined &&
      operatorId === undefined &&
      isActive === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required",
      });
    }

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Route name cannot be empty",
      });
    }

    if (
      code !== undefined &&
      (typeof code !== "string" || !code.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Route code cannot be empty",
      });
    }

    if (
      operatorId !== undefined &&
      (!Number.isInteger(operatorId) || operatorId <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid operator ID",
      });
    }

    if (
      isActive !== undefined &&
      typeof isActive !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be a string or null",
      });
    }

    const route = await routeService.updateRoute(routeId, {
      name,
      code,
      description,
      operatorId,
      isActive,
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Route updated successfully",
      data: route,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Route code already exists",
      });
    }

    if (error.code === "P2003") {
      return res.status(400).json({
        success: false,
        message: "Invalid operator ID",
      });
    }

    console.error("PATCH /api/routes failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update route",
    });
  }
}

// POST /api/routes/:id/stops
export async function addStopToRoute(req, res) {
  try {
    const routeId = Number(req.params.id);
    const { stopId, sequence } = req.body ?? {};

    if (!Number.isInteger(routeId) || routeId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid route ID",
      });
    }

    if (!Number.isInteger(stopId) || stopId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid stop ID is required",
      });
    }

    if (!Number.isInteger(sequence) || sequence <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid sequence is required",
      });
    }

    const result = await routeService.addStopToRoute(
      routeId,
      stopId,
      sequence
    );

    if (result.notFound === "route") {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    if (result.notFound === "stop") {
      return res.status(404).json({
        success: false,
        message: "Stop not found",
      });
    }

    if (result.conflict) {
      return res.status(409).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Stop added to route successfully",
      data: result.data,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Stop or sequence already exists in this route",
      });
    }

    if (error.code === "P2003") {
      return res.status(404).json({
        success: false,
        message: "Route or stop not found",
      });
    }

    console.error("POST route stop failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add stop to route",
    });
  }
}

// GET /api/routes/:id/stops
export async function getRouteStops(req, res) {
  try {
    const routeId = Number(req.params.id);

    if (!Number.isInteger(routeId) || routeId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid route ID",
      });
    }

    const route = await routeService.getRouteById(routeId);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    const stops = await routeService.getRouteStops(routeId);

    return res.status(200).json({
      success: true,
      data: stops,
    });
  } catch (error) {
    console.error("GET route stops failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve route stops",
    });
  }
}

// PATCH /api/routes/:id/stops/:stopId
export async function updateRouteStopSequence(req, res) {
  try {
    const routeId = Number(req.params.id);
    const stopId = Number(req.params.stopId);
    const { sequence } = req.body ?? {};

    if (
      !Number.isInteger(routeId) ||
      routeId <= 0 ||
      !Number.isInteger(stopId) ||
      stopId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid route ID or stop ID",
      });
    }

    if (!Number.isInteger(sequence) || sequence <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid sequence is required",
      });
    }

    const result = await routeService.updateRouteStopSequence(
      routeId,
      stopId,
      sequence
    );

    if (result.notFound === "route") {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    if (result.notFound === "stop") {
      return res.status(404).json({
        success: false,
        message: "Stop not found",
      });
    }

    if (result.notFound === "route_stop") {
      return res.status(404).json({
        success: false,
        message: "Stop not found in this route",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Stop sequence updated successfully",
      data: result.data,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Stop not found in this route",
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This sequence is already occupied",
      });
    }

    console.error("PATCH route stop sequence failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update stop sequence",
    });
  }
}

// DELETE /api/routes/:id/stops/:stopId
export async function removeStopFromRoute(req, res) {
  try {
    const routeId = Number(req.params.id);
    const stopId = Number(req.params.stopId);

    if (
      !Number.isInteger(routeId) ||
      routeId <= 0 ||
      !Number.isInteger(stopId) ||
      stopId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid route ID or stop ID",
      });
    }

    const result = await routeService.removeStopFromRoute(routeId, stopId);

    if (result.notFound === "route") {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }

    if (result.notFound === "stop") {
      return res.status(404).json({
        success: false,
        message: "Stop not found",
      });
    }

    if (result.notFound === "route_stop") {
      return res.status(404).json({
        success: false,
        message: "Stop not found in this route",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Stop removed from route successfully",
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Stop not found in this route",
      });
    }

    console.error("DELETE route stop failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove stop from route",
    });
  }
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
