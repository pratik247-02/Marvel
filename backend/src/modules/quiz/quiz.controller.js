import { quizService } from "./quiz.service.js";
import { success, created, noContent, paginated } from "../../utils/response.js";

export const quizController = {
  async getAll(req, res, next) {
    try {
      const result = await quizService.findAll(req.query);
      return paginated(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const quiz = await quizService.findById(req.params.id);
      return success(res, quiz);
    } catch (error) {
      next(error);
    }
  },

  async getForPlay(req, res, next) {
    try {
      const quiz = await quizService.getQuizForPlay(req.params.id);
      return success(res, quiz);
    } catch (error) {
      next(error);
    }
  },

  async getActive(req, res, next) {
    try {
      const quiz = await quizService.getActiveQuiz();
      return success(res, quiz);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const quiz = await quizService.create(req.body);
      return created(res, quiz, "Quiz created successfully");
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const quiz = await quizService.update(req.params.id, req.body);
      return success(res, quiz, "Quiz updated successfully");
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await quizService.delete(req.params.id);
      return noContent(res);
    } catch (error) {
      next(error);
    }
  },

  async submit(req, res, next) {
    try {
      const result = await quizService.submitQuiz(req.params.id, req.body.answers);
      return success(res, result, "Quiz submitted successfully");
    } catch (error) {
      next(error);
    }
  },
};
