import rateLimit from "express-rate-limit";

export const gpsLocationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  keyGenerator: (req) => String(req.gpsDevice.id),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many GPS updates. Please try again later.",
  },
});

export default gpsLocationLimiter;
