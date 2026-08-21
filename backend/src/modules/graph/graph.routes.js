import { Router } from "express";
import { graphController } from "./graph.controller.js";
import { validate } from "../../middlewares/validate.js";
import { graphValidators } from "./graph.validators.js";
import { requireAdmin } from "../../middlewares/requireAdmin.js";

const router = Router();

// Specific routes before the parameterized one so "stats" is not read as a ref.
router.get("/path", validate(graphValidators.path), graphController.getPath);
router.get("/stats", validate(graphValidators.stats), graphController.getStats);
router.get("/full", graphController.getFullGraph);
// Forcing a rebuild is an operational action, not a public one.
router.post("/rebuild", ...requireAdmin, graphController.rebuild);

router.get(
  "/network/:ref",
  validate(graphValidators.network),
  graphController.getNetwork
);

export default router;
