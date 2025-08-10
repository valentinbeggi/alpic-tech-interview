import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./.data/app.db", // local dev DB file
  },
  // nice to have: strict casing and verbose
  strict: true,
  verbose: true,
});
