import { createHash, randomBytes } from "node:crypto";

export function generateGpsApiKey() {
  return `bbgps_${randomBytes(32).toString("hex")}`;
}

export function hashGpsApiKey(apiKey) {
  return createHash("sha256").update(apiKey, "utf8").digest("hex");
}