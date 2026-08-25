import mongoose from "mongoose";
import { withSlug } from "../../utils/slug.js";

const sectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["biography", "timeline", "gallery", "quotes", "trivia", "relationships"],
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

const themeSchema = new mongoose.Schema(
  {
    colorPrimary: { type: String, default: "#e23636" },
    colorSecondary: { type: String, default: "#000000" },
  },
  { _id: false }
);

const characterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Character name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    alias: {
      type: String,
      trim: true,
      maxlength: [100, "Alias cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    image: {
      type: String,
      trim: true,
    },
    affiliations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Character",
      },
    ],
    appearances: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
      },
    ],
    artifactsUsed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artifact",
      },
    ],
    powers: [
      {
        type: String,
        trim: true,
      },
    ],
    /**
     * The performer, from TMDB cast credits. Deliberately a separate field
     * from `image`: TMDB has no character artwork, and using a headshot as the
     * character's own picture is the bug that once put Vin Diesel on Groot's
     * card. Shown beside the portrait, labelled as the actor.
     */
    actor: {
      name: { type: String, trim: true },
      photo: { type: String, trim: true },
      creditedAs: { type: String, trim: true },
    },
    /**
     * Long-form biography from the MCU wiki, kept separate from
     * `description`.
     *
     * `description` is the curated one-liner - a median of 112 characters,
     * which is what a card or a list row has room for. This is the several
     * paragraphs a detail page needs. Two fields rather than one because each
     * surface wants text sized for it, and overwriting the hand-written
     * summary with a truncated wiki sentence would make every card worse.
     *
     * `source` carries the page the text came from: the wiki is CC-BY-SA, so
     * attribution is a licence condition, not a nicety.
     */
    bio: {
      lede: { type: String, trim: true },
      paragraphs: [{ type: String, trim: true }],
      source: { type: String, trim: true },
      sourceTitle: { type: String, trim: true },
    },
    sections: [sectionSchema],
    theme: {
      type: themeSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

withSlug(characterSchema, "name");

// Index for search
characterSchema.index({ name: "text", alias: "text", description: "text" });
characterSchema.index({ name: 1 });

// Multikey indexes backing the graph traversal - every relation the
// Connection Engine walks is filtered on one of these.
characterSchema.index({ affiliations: 1 });
characterSchema.index({ appearances: 1 });
characterSchema.index({ artifactsUsed: 1 });

const Character = mongoose.model("Character", characterSchema);

export default Character;