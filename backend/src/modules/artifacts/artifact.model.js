import mongoose from "mongoose";
import { withSlug } from "../../utils/slug.js";

const artifactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Artifact name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },
    image: {
      type: String,
      trim: true,
    },
    holders: [
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
    origin: {
      type: String,
      trim: true,
    },
    powers: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["active", "destroyed", "unknown", "lost"],
      default: "unknown",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
withSlug(artifactSchema, "name");

artifactSchema.index({ name: "text", description: "text" });
artifactSchema.index({ name: 1 });

artifactSchema.index({ status: 1 });
artifactSchema.index({ holders: 1 });

const Artifact = mongoose.model("Artifact", artifactSchema);

export default Artifact;
