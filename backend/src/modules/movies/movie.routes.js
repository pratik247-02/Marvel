import { Router } from "express";
import { movieController } from "./movie.controller.js";
import { validate } from "../../middlewares/validate.js";
import { requireAdmin } from "../../middlewares/requireAdmin.js";
import { idempotency } from "../../middlewares/idempotency.js";
import { movieValidators } from "./movie.validators.js";

const router = Router();

router.get("/timeline", movieController.getTimeline);
router.get("/phase/:phase", movieController.getByPhase);

router
  .route("/")
  .get(movieController.getAll)
  .post(...requireAdmin, idempotency, validate(movieValidators.create), movieController.create);

router
  .route("/:id")
  .get(validate(movieValidators.getById), movieController.getById)
  .patch(...requireAdmin, validate(movieValidators.update), movieController.update)
  .delete(...requireAdmin, validate(movieValidators.getById), movieController.delete);

export default router;
