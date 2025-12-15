import { battleService } from "./battle.service.js";
import { success, created, noContent, paginated } from "../../utils/response.js";

export const battleController = {
  async getAll(req, res, next) {
    try {
      const result = await battleService.findAll(req.query);
      return paginated(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const battle = await battleService.findById(req.params.id);
      return success(res, battle);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const battle = await battleService.create(req.body);
      return created(res, battle, "Battle created successfully");
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const battle = await battleService.update(req.params.id, req.body);
      return success(res, battle, "Battle updated successfully");
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await battleService.delete(req.params.id);
      return noContent(res);
    } catch (error) {
      next(error);
    }
  },

  async getByMovie(req, res, next) {
    try {
      const battles = await battleService.findByMovie(req.params.movieId);
      return success(res, battles);
    } catch (error) {
      next(error);
    }
  },

  async getByCharacter(req, res, next) {
    try {
      const battles = await battleService.findByCharacter(req.params.characterId);
      return success(res, battles);
    } catch (error) {
      next(error);
    }
  },
};
