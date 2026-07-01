import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// Vitest config for La Feria CR. `tsconfigPaths` teaches Vitest the `@/*` → `./src/*` alias
// from tsconfig.json so tests import modules the same way app code does. Tests live next to
// the code they cover as `*.test.ts`. The default `node` environment suits the pure
// server/lib logic we test today; add jsdom + a React setup here when we start testing
// components.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
