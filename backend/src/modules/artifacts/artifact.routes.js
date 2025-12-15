import { Router } from "express";
import { artifactController } from "./artifact.controller.js";
import { validate } from "../../middlewares/validate.js";
import { artifactValidators } from "./artifact.validators.js";

const router = Router();

router
  .route("/")
  .get(artifactController.getAll)
  .post(validate(artifactValidators.create), artifactController.create);

router
  .route("/:id")
  .get(validate(artifactValidators.getById), artifactController.getById)
  .patch(validate(artifactValidators.update), artifactController.update)
  .delete(validate(artifactValidators.getById), artifactController.delete);

export default router;
