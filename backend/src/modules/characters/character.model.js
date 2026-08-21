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

const statsSchema = new mongoose.Schema(
  {
    strength: { type: Number, min: 0, max: 100, default: 50 },
    intelligence: { type: Number, min: 0, max: 100, default: 50 },
    speed: { type: Number, min: 0, max: 100, default: 50 },
    durability: { type: Number, min: 0, max: 100, default: 50 },
    energy: { type: Number, min: 0, max: 100, default: 50 },
    combat: { type: Number, min: 0, max: 100, default: 50 },
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
    stats: {
      type: statsSchema,
      default: () => ({}),
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