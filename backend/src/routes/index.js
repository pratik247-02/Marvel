import { Router } from "express";
// Import feature routes here
// import authRoutes from "./auth.routes.js";

const router = Router();

// Health check for API
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Marvel API is running",
    version: "1.0.0",
  });
});

// Mount feature routes here
// router.use("/auth", authRoutes);

export default router;
