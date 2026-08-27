import { Router } from "express";
import {
  characterRoutes,
  movieRoutes,
  artifactRoutes,
  battleRoutes,
  quizRoutes,
  teamRoutes,
  graphRoutes,
  authRoutes,
} from "../modules/index.js";
import { normalizePagination } from "../middlewares/pagination.js";

const router = Router();

// Health check for API
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Marvel API is running",
    version: "1.0.0",
  });
});

/**
 * Validate `page` and `limit` once, for every list endpoint beneath this
 * point. Six services parsed them independently with `parseInt`, which turned
 * `page=-5` into a negative skip and a 500.
 */
router.use(normalizePagination);

// Mount feature routes
router.use("/auth", authRoutes);
router.use("/characters", characterRoutes);
router.use("/movies", movieRoutes);
router.use("/artifacts", artifactRoutes);
router.use("/battles", battleRoutes);
router.use("/quiz", quizRoutes);
router.use("/teams", teamRoutes);
router.use("/graph", graphRoutes);

export default router;
