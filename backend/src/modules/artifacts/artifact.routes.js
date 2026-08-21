import { Router } from "express";
import { artifactController } from "./artifact.controller.js";
import { validate } from "../../middlewares/validate.js";
import { requireAdmin } from "../../middlewares/requireAdmin.js";
import { idempotency } from "../../middlewares/idempotency.js";
import { artifactValidators } from "./artifact.validators.js";

const router = Router();

router
  .route("/")
  .get(artifactController.getAll)
  .post(...requireAdmin, idempotency, validate(artifactValidators.create), artifactController.create);

router
  .route("/:id")
  .get(validate(artifactValidators.getById), artifactController.getById)
  .patch(...requireAdmin, validate(artifactValidators.update), artifactController.update)
  .delete(...requireAdmin, validate(artifactValidators.getById), artifactController.delete);

export default router;
