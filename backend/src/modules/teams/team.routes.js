import { Router } from "express";
import { teamController } from "./team.controller.js";
import { validate } from "../../middlewares/validate.js";
import { requireAdmin } from "../../middlewares/requireAdmin.js";
import { idempotency } from "../../middlewares/idempotency.js";
import { teamValidators } from "./team.validators.js";

const router = Router();

router
  .route("/")
  .get(teamController.getAll)
  .post(...requireAdmin, idempotency, validate(teamValidators.create), teamController.create);

router
  .route("/:id")
  .get(validate(teamValidators.getById), teamController.getById)
  .patch(...requireAdmin, validate(teamValidators.update), teamController.update)
  .delete(...requireAdmin, validate(teamValidators.getById), teamController.delete);

router.post(
  "/:id/members",
  ...requireAdmin,
  validate(teamValidators.addMember),
  teamController.addMember
);

router.delete(
  "/:id/members",
  ...requireAdmin,
  validate(teamValidators.removeMember),
  teamController.removeMember
);

export default router;
