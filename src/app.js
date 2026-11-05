import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import busRoutes from "./routes/bus.routes.js";
import operatorRoutes from "./routes/operator.routes.js";
import routeRoutes from "./routes/route.routes.js";
import stopRoutes from "./routes/stop.routes.js";
import tripRoutes from "./routes/trip.routes.js";
import searchRoutes from "./routes/search.routes.js";
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/stops", stopRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/operators", operatorRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/search", searchRoutes);
export default app;
