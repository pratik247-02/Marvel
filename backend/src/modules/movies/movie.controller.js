import { movieService } from "./movie.service.js";
import { success, created, noContent, paginated } from "../../utils/response.js";

export const movieController = {
  async getAll(req, res, next) {
    try {
      const result = await movieService.findAll(req.query);
      return paginated(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const movie = await movieService.findById(req.params.id);
      return success(res, movie);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const movie = await movieService.create(req.body);
      return created(res, movie, "Movie created successfully");
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const movie = await movieService.update(req.params.id, req.body);
      return success(res, movie, "Movie updated successfully");
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await movieService.delete(req.params.id);
      return noContent(res);
    } catch (error) {
      next(error);
    }
  },

  async getByPhase(req, res, next) {
    try {
      const movies = await movieService.getByPhase(req.params.phase);
      return success(res, movies);
    } catch (error) {
      next(error);
    }
  },

  async getTimeline(req, res, next) {
    try {
      const timeline = await movieService.getTimeline();
      return success(res, timeline);
    } catch (error) {
      next(error);
    }
  },
};
