/**
 * Slug helpers.
 *
 * Slugs are the natural key for content documents: they are stable, readable,
 * and safe in a URL (`/characters/tony-stark`). The ETL upserts on them, so a
 * slug must stay put once assigned - renaming a document should not silently
 * mint a second copy.
 */

/**
 * Convert a display name into a URL-safe slug.
 *
 * Diacritics are folded to ASCII first so "Loki Laufeyson" and "Lokí Laufeyson"
 * collapse to the same slug rather than producing two different ones.
 *
 * @param {string} value
 * @returns {string}
 */
export const slugify = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    // Strip combining marks left behind by the decomposition above.
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    // Drop apostrophes outright so "T'Challa" becomes "tchalla", not "t-challa".
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Attach slug generation to a schema.
 *
 * The slug is derived once, on insert, from `sourceField`. Later edits to that
 * field do not move the slug - a published URL should not break because someone
 * corrected a typo in a title.
 *
 * @param {import("mongoose").Schema} schema
 * @param {string} sourceField - field the slug is derived from ("name"/"title")
 */
export const withSlug = (schema, sourceField) => {
  schema.add({
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      unique: true,
      sparse: true,
    },
  });

  schema.pre("validate", function assignSlug(next) {
    if (!this.slug && this[sourceField]) {
      this.slug = slugify(this[sourceField]);
    }
    next();
  });
};
