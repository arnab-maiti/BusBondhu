import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: ".",
    include: ["tests/**/*.test.js"],
    globalSetup: ["./tests/setup/global-setup.js"],
    hookTimeout: 60000,
    testTimeout: 30000,
    env: {
      NODE_ENV: "test",
    },
  },
});
