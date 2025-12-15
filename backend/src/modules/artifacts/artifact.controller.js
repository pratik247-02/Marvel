import { artifactService } from "./artifact.service.js";
import { success, created, noContent, paginated } from "../../utils/response.js";

export const artifactController = {
  async getAll(req, res, next) {
    try {
      const result = await artifactService.findAll(req.query);
      return paginated(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const artifact = await artifactService.findById(req.params.id);
      return success(res, artifact);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const artifact = await artifactService.create(req.body);
      return created(res, artifact, "Artifact created successfully");
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const artifact = await artifactService.update(req.params.id, req.body);
      return success(res, artifact, "Artifact updated successfully");
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await artifactService.delete(req.params.id);
      return noContent(res);
    } catch (error) {
      next(error);
    }
  },
};
