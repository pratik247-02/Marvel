import { characterService } from "./character.service.js";
import { success, created, noContent, paginated } from "../../utils/response.js";

export const characterController = {
  async getAll(req, res, next) {
    try {
      const result = await characterService.findAll(req.query);
      return paginated(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const character = await characterService.findById(req.params.id);
      return success(res, character);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const character = await characterService.create(req.body);
      return created(res, character, "Character created successfully");
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const character = await characterService.update(req.params.id, req.body);
      return success(res, character, "Character updated successfully");
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await characterService.delete(req.params.id);
      return noContent(res);
    } catch (error) {
      next(error);
    }
  },

  async addSection(req, res, next) {
    try {
      const character = await characterService.addSection(req.params.id, req.body);
      return success(res, character, "Section added successfully");
    } catch (error) {
      next(error);
    }
  },

  async updateStats(req, res, next) {
    try {
      const character = await characterService.updateStats(req.params.id, req.body);
      return success(res, character, "Stats updated successfully");
    } catch (error) {
      next(error);
    }
  },
};