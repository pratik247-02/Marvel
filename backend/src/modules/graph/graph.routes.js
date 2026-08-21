import { Router } from "express";
import { graphController } from "./graph.controller.js";
import { validate } from "../../middlewares/validate.js";
import { graphValidators } from "./graph.validators.js";

const router = Router();

// Specific routes before the parameterized one so "stats" is not read as a ref.
router.get("/path", validate(graphValidators.path), graphController.getPath);
router.get("/stats", validate(graphValidators.stats), graphController.getStats);
router.get("/full", graphController.getFullGraph);
router.post("/rebuild", graphController.rebuild);

router.get(
  "/network/:ref",
  validate(graphValidators.network),
  graphController.getNetwork
);

export default router;
