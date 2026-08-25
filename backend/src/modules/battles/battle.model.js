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
    /**
     * The card image for this battle.
     *
     * Separate from `images` below, which is a gallery. A card needs one
     * primary image, and picking `images[0]` would make the UI guess at an
     * ordering the data does not promise.
     *
     * `imageOrigin` says where it came from: most battles have no art of
     * their own on the wiki, so they fall back to the poster of the film they
     * happened in. Worth recording rather than inferring - a borrowed poster
     * is shared by every battle in that film.
     */
    image: {
      type: String,
      trim: true,
    },
    imageOrigin: {
      type: String,
      enum: ["wiki", "movie-poster"],
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
