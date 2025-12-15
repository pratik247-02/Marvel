import { Router } from "express";
import { battleController } from "./battle.controller.js";
import { validate } from "../../middlewares/validate.js";
import { battleValidators } from "./battle.validators.js";

const router = Router();

router.get("/movie/:movieId", battleController.getByMovie);
router.get("/character/:characterId", battleController.getByCharacter);

router
  .route("/")
  .get(battleController.getAll)
  .post(validate(battleValidators.create), battleController.create);

router
  .route("/:id")
  .get(validate(battleValidators.getById), battleController.getById)
  .patch(validate(battleValidators.update), battleController.update)
  .delete(validate(battleValidators.getById), battleController.delete);

export default router;
