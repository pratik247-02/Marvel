import mongoose from "mongoose";
import { withSlug } from "../../utils/slug.js";

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Team name is required"],
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
    logo: {
      type: String,
      trim: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Character",
      },
    ],
    leaders: [
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
    headquarters: {
      type: String,
      trim: true,
    },
    founded: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "disbanded", "reformed", "unknown"],
      default: "active",
    },
    theme: {
      colorPrimary: { type: String, default: "#e23636" },
      colorSecondary: { type: String, default: "#000000" },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
withSlug(teamSchema, "name");

teamSchema.index({ name: "text", description: "text" });
teamSchema.index({ name: 1 });
teamSchema.index({ status: 1 });

teamSchema.index({ members: 1 });
teamSchema.index({ appearances: 1 });

const Team = mongoose.model("Team", teamSchema);

export default Team;
