import { StatusCodes } from "http-status-codes";
import { AppError } from "../middlewares/errorHandler.js";

/**
 * Optimistic concurrency for updates.
 *
 * Two admins open the same character, both edit, both save. Without a check
 * the second write silently overwrites the first and nobody learns that an
 * edit was lost. Pessimistic locking would prevent it but requires holding a
 * lock across a human's editing session, which is the wrong shape for a web
 * form.
 *
 * The optimistic approach instead lets both edits proceed and detects the
 * collision at write time. Mongoose maintains a `__v` version on every
 * document; a client that read version 3 sends `expectedVersion: 3` back, and
 * the update only matches while the stored version is still 3. If the other
 * admin saved first the version has moved on, nothing matches, and the caller
 * gets a 409 telling them to re-read and reapply rather than a silent
 * clobber.
 *
 * Sending no `expectedVersion` skips the check, so existing callers and
 * scripts keep working - the guarantee is opt-in per request.
 */

/**
 * Apply a version-guarded update.
 *
 * @param {import("mongoose").Model} Model
 * @param {string} id
 * @param {object} data - fields to set; `expectedVersion` is stripped out
 * @param {string} label - entity name used in error messages
 */
export async function updateWithVersion(Model, id, data, label = "Document") {
  const { expectedVersion, ...fields } = data ?? {};

  if (expectedVersion === undefined) {
    const updated = await Model.findByIdAndUpdate(id, fields, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      throw new AppError(`${label} not found`, StatusCodes.NOT_FOUND);
    }
    return updated;
  }

  const updated = await Model.findOneAndUpdate(
    { _id: id, __v: expectedVersion },
    // Bumping __v ourselves is what makes the next stale write fail. Mongoose
    // only increments it automatically on array modifications via save().
    { $set: fields, $inc: { __v: 1 } },
    { new: true, runValidators: true }
  );

  if (updated) {
    return updated;
  }

  // Nothing matched. Distinguish "gone" from "changed underneath you", because
  // the caller's next action differs: one is give up, the other is re-read.
  const current = await Model.findById(id).select("__v").lean();
  if (!current) {
    throw new AppError(`${label} not found`, StatusCodes.NOT_FOUND);
  }

  throw new AppError(
    `${label} was modified by someone else. Reload and try again.`,
    StatusCodes.CONFLICT,
    { expectedVersion, currentVersion: current.__v }
  );
}
