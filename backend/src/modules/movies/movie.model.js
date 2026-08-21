import mongoose from "mongoose";
import { withSlug } from "../../utils/slug.js";

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Movie title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    releaseYear: {
      type: Number,
      required: [true, "Release year is required"],
      min: [2008, "MCU started in 2008"],
      max: [2030, "Invalid year"],
    },
    phase: {
      type: String,
      required: [true, "Phase is required"],
      enum: ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "Phase 5", "Phase 6"],
    },
    characters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Character",
      },
    ],
    poster: {
      type: String,
      trim: true,
    },
    synopsis: {
      type: String,
      trim: true,
      maxlength: [5000, "Synopsis cannot exceed 5000 characters"],
    },
    director: {
      type: String,
      trim: true,
    },
    boxOffice: {
      type: Number,
    },
    runtime: {
      type: Number, // in minutes
    },
    rating: {
      type: Number,
      min: 0,
      max: 10,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
withSlug(movieSchema, "title");

movieSchema.index({ title: "text", synopsis: "text" });
movieSchema.index({ releaseYear: 1 });
movieSchema.index({ phase: 1 });

// Timeline and phase browsing sort by year within a phase.
movieSchema.index({ phase: 1, releaseYear: -1 });
movieSchema.index({ characters: 1 });

const Movie = mongoose.model("Movie", movieSchema);

export default Movie;
