import { Router } from "express";
import { battleController } from "./battle.controller.js";
import { validate } from "../../middlewares/validate.js";
import { requireAdmin } from "../../middlewares/requireAdmin.js";
import { battleValidators } from "./battle.validators.js";

const router = Router();

router.get("/movie/:movieId", battleController.getByMovie);
router.get("/character/:characterId", battleController.getByCharacter);

router
  .route("/")
  .get(battleController.getAll)
  .post(...requireAdmin, validate(battleValidators.create), battleController.create);

router
  .route("/:id")
  .get(validate(battleValidators.getById), battleController.getById)
  .patch(...requireAdmin, validate(battleValidators.update), battleController.update)
  .delete(...requireAdmin, validate(battleValidators.getById), battleController.delete);

export default router;
