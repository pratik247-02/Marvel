import { Router } from "express";
import { quizController } from "./quiz.controller.js";
import { validate } from "../../middlewares/validate.js";
import { requireAdmin } from "../../middlewares/requireAdmin.js";
import { quizValidators } from "./quiz.validators.js";

const router = Router();

router.get("/active", quizController.getActive);
router.get("/:id/play", quizController.getForPlay);
// Deliberately public: submitting answers is how a visitor takes the quiz.
router.post("/:id/submit", validate(quizValidators.submit), quizController.submit);

router
  .route("/")
  .get(quizController.getAll)
  .post(...requireAdmin, validate(quizValidators.create), quizController.create);

router
  .route("/:id")
  .get(validate(quizValidators.getById), quizController.getById)
  .patch(...requireAdmin, validate(quizValidators.update), quizController.update)
  .delete(...requireAdmin, validate(quizValidators.getById), quizController.delete);

export default router;
