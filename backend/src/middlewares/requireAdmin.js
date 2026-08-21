import { authenticate, authorize } from "./auth.js";

/**
 * Guard for content mutations.
 *
 * Reads stay public - this is a reference site, and the data is not secret.
 * Every write requires a signed-in admin, which closes the hole where any
 * caller could create, edit or delete content.
 *
 * Exported as an array so it can be spread into a route definition:
 *   router.post("/", ...requireAdmin, validate(...), controller.create)
 */
export const requireAdmin = [authenticate, authorize("admin")];
