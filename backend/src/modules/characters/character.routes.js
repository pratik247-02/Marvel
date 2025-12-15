import { Router } from "express";
import { characterController } from "./character.controller.js";
import { validate } from "../../middlewares/validate.js";
import { characterValidators } from "./character.validators.js";

const router = Router();

router
  .route("/")
  .get(characterController.getAll)
  .post(validate(characterValidators.create), characterController.create);

router
  .route("/:id")
  .get(validate(characterValidators.getById), characterController.getById)
  .patch(validate(characterValidators.update), characterController.update)
  .delete(validate(characterValidators.getById), characterController.delete);

router.post(
  "/:id/sections",
  validate(characterValidators.addSection),
  characterController.addSection
);

router.patch(
  "/:id/stats",
  validate(characterValidators.updateStats),
  characterController.updateStats
);

export default router;