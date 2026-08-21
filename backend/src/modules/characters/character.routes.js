import { Router } from "express";
import { characterController } from "./character.controller.js";
import { validate } from "../../middlewares/validate.js";
import { requireAdmin } from "../../middlewares/requireAdmin.js";
import { idempotency } from "../../middlewares/idempotency.js";
import { characterValidators } from "./character.validators.js";

const router = Router();

router
  .route("/")
  .get(characterController.getAll)
  .post(
    ...requireAdmin,
    idempotency,
    validate(characterValidators.create),
    characterController.create
  );

router
  .route("/:id")
  .get(validate(characterValidators.getById), characterController.getById)
  .patch(...requireAdmin, validate(characterValidators.update), characterController.update)
  .delete(...requireAdmin, validate(characterValidators.getById), characterController.delete);

router.post(
  "/:id/sections",
  ...requireAdmin,
  validate(characterValidators.addSection),
  characterController.addSection
);

router.patch(
  "/:id/stats",
  ...requireAdmin,
  validate(characterValidators.updateStats),
  characterController.updateStats
);

export default router;