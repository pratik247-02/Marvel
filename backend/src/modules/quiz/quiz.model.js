import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
      maxlength: [500, "Prompt cannot exceed 500 characters"],
    },
    options: [optionSchema],
    image: {
      type: String,
    },
  },
  { _id: false }
);

const resultLogicSchema = new mongoose.Schema(
  {
    heroId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Character",
      required: true,
    },
    logic: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Quiz title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    image: {
      type: String,
    },
    questions: [questionSchema],
    results: [resultLogicSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
quizSchema.index({ title: "text" });
quizSchema.index({ isActive: 1 });

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
