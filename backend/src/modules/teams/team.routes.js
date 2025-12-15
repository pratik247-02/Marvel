import { Router } from "express";
import { teamController } from "./team.controller.js";
import { validate } from "../../middlewares/validate.js";
import { teamValidators } from "./team.validators.js";

const router = Router();

router
  .route("/")
  .get(teamController.getAll)
  .post(validate(teamValidators.create), teamController.create);

router
  .route("/:id")
  .get(validate(teamValidators.getById), teamController.getById)
  .patch(validate(teamValidators.update), teamController.update)
  .delete(validate(teamValidators.getById), teamController.delete);

router.post(
  "/:id/members",
  validate(teamValidators.addMember),
  teamController.addMember
);

router.delete(
  "/:id/members",
  validate(teamValidators.removeMember),
  teamController.removeMember
);

export default router;
