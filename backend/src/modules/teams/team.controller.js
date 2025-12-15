import { teamService } from "./team.service.js";
import { success, created, noContent, paginated } from "../../utils/response.js";

export const teamController = {
  async getAll(req, res, next) {
    try {
      const result = await teamService.findAll(req.query);
      return paginated(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const team = await teamService.findById(req.params.id);
      return success(res, team);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const team = await teamService.create(req.body);
      return created(res, team, "Team created successfully");
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const team = await teamService.update(req.params.id, req.body);
      return success(res, team, "Team updated successfully");
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      await teamService.delete(req.params.id);
      return noContent(res);
    } catch (error) {
      next(error);
    }
  },

  async addMember(req, res, next) {
    try {
      const team = await teamService.addMember(req.params.id, req.body.memberId);
      return success(res, team, "Member added successfully");
    } catch (error) {
      next(error);
    }
  },

  async removeMember(req, res, next) {
    try {
      const team = await teamService.removeMember(req.params.id, req.body.memberId);
      return success(res, team, "Member removed successfully");
    } catch (error) {
      next(error);
    }
  },
};
