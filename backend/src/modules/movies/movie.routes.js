import { Router } from "express";
import { movieController } from "./movie.controller.js";
import { validate } from "../../middlewares/validate.js";
import { movieValidators } from "./movie.validators.js";

const router = Router();

router.get("/timeline", movieController.getTimeline);
router.get("/phase/:phase", movieController.getByPhase);

router
  .route("/")
  .get(movieController.getAll)
  .post(validate(movieValidators.create), movieController.create);

router
  .route("/:id")
  .get(validate(movieValidators.getById), movieController.getById)
  .patch(validate(movieValidators.update), movieController.update)
  .delete(validate(movieValidators.getById), movieController.delete);

export default router;
