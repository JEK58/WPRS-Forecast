import { join } from "path";
import { configDefaults, defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  console.log("mode:", mode);
  // @ts-expect-error I have no idea why this is happening but it works
  process.env = loadEnv(mode, process.cwd(), "");
  return {
    test: {
      exclude: [...configDefaults.exclude, "**/e2e/**"],
      environment: "node",
    },
    resolve: {
      alias: {
        "@": join(__dirname, "./src/"),
      },
    },
  };
});
