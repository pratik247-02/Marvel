import dotenv from "dotenv";

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",

  // Database
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/marvel",

  // JWT
  jwtSecret: process.env.JWT_SECRET || "your-super-secret-key-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",

  // Bcrypt
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,

  // TMDB - only needed to refresh the fixtures. The seed reads committed
  // fixtures by default, so the app runs without a key.
  tmdb: {
    accessToken: process.env.TMDB_ACCESS_TOKEN || "",
    apiUrl: "https://api.themoviedb.org/3",
    imageUrl: "https://image.tmdb.org/t/p",
  },
};

// Validate required environment variables in production
if (config.nodeEnv === "production") {
  const requiredEnvVars = ["JWT_SECRET", "MONGO_URI"];
  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
  }
}
