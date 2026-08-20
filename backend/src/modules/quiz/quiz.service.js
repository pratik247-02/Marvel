import Quiz from "./quiz.model.js";
import { AppError } from "../../middlewares/errorHandler.js";

export const quizService = {
  async findAll(query = {}) {
    const {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      isActive,
      ...filters
    } = query;

    const skip = (page - 1) * limit;

    const queryObj = { ...filters };

    if (isActive !== undefined) {
      queryObj.isActive = isActive === "true";
    }

    const [quizzes, total] = await Promise.all([
      Quiz.find(queryObj)
        .select("title description image isActive totalAttempts createdAt")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Quiz.countDocuments(queryObj),
    ]);

    return {
      data: quizzes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id) {
    const quiz = await Quiz.findById(id).populate("results.heroId", "name alias image description");

    if (!quiz) {
      throw new AppError("Quiz not found", 404);
    }

    return quiz;
  },

  async getQuizForPlay(id) {
    const quiz = await Quiz.findById(id).select("title description image questions");

    if (!quiz) {
      throw new AppError("Quiz not found", 404);
    }

    return quiz;
  },

  async create(data) {
    const quiz = await Quiz.create(data);
    return quiz;
  },

  async update(id, data) {
    const quiz = await Quiz.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!quiz) {
      throw new AppError("Quiz not found", 404);
    }

    return quiz;
  },

  async delete(id) {
    const quiz = await Quiz.findByIdAndDelete(id);

    if (!quiz) {
      throw new AppError("Quiz not found", 404);
    }

    return quiz;
  },

  async submitQuiz(id, answers) {
    const quiz = await Quiz.findById(id).populate("results.heroId", "name alias image description theme");

    if (!quiz) {
      throw new AppError("Quiz not found", 404);
    }

    // Calculate scores based on answers and result logic
    const scores = {};

    quiz.results.forEach((result) => {
      scores[result.heroId._id.toString()] = 0;
    });

    // Process each answer
    Object.entries(answers).forEach(([questionId, answerValue]) => {
      quiz.results.forEach((result) => {
        const logic = result.logic;

        // Check if this answer matches the logic for this hero
        if (logic[questionId] && logic[questionId].includes(answerValue)) {
          scores[result.heroId._id.toString()] += 1;
        }
      });
    });

    // Find the hero with the highest score
    let maxScore = 0;
    let matchedHeroId = null;

    Object.entries(scores).forEach(([heroId, score]) => {
      if (score > maxScore) {
        maxScore = score;
        matchedHeroId = heroId;
      }
    });

    // Get the matched result
    const matchedResult = quiz.results.find(
      (r) => r.heroId._id.toString() === matchedHeroId
    );

    // Increment total attempts
    await Quiz.findByIdAndUpdate(id, { $inc: { totalAttempts: 1 } });

    return {
      hero: matchedResult?.heroId || null,
      description: matchedResult?.description || null,
      scores,
      totalQuestions: quiz.questions.length,
    };
  },

  async getActiveQuiz() {
    const quiz = await Quiz.findOne({ isActive: true })
      .select("title description image questions")
      .sort("-createdAt");

    if (!quiz) {
      throw new AppError("No active quiz found", 404);
    }

    return quiz;
  },
};
