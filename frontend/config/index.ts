// Export all configs here
// Example: export * from "./featureOne";

export const APP_CONFIG = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Marvel",
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  env: process.env.NEXT_PUBLIC_APP_ENV || "development",
} as const;
