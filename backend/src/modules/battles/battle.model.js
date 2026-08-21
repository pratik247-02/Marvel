import mongoose from "mongoose";
import { withSlug } from "../../utils/slug.js";

const battleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Battle name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Character",
      },
    ],
    outcome: {
      type: String,
      trim: true,
      maxlength: [1000, "Outcome cannot exceed 1000 characters"],
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      type: String,
      trim: true,
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Character",
    },
    casualties: {
      type: Number,
      default: 0,
    },
    significance: {
      type: String,
      enum: ["minor", "major", "universe-altering"],
      default: "minor",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
withSlug(battleSchema, "name");

battleSchema.index({ name: "text", description: "text" });
battleSchema.index({ movie: 1 });
battleSchema.index({ significance: 1 });

// Battle lists filter by significance and sort newest-first.
battleSchema.index({ significance: 1, createdAt: -1 });
battleSchema.index({ participants: 1 });

const Battle = mongoose.model("Battle", battleSchema);

export default Battle;
