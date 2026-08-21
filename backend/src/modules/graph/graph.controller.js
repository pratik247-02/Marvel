import { graphService } from "./graph.service.js";
import { success } from "../../utils/response.js";

export const graphController = {
  async getPath(req, res, next) {
    try {
      const { from, to, mode } = req.query;
      const result = await graphService.findPath(from, to, mode);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getNetwork(req, res, next) {
    try {
      const result = await graphService.findNetwork(req.params.ref, req.query.depth);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getStats(req, res, next) {
    try {
      const result = await graphService.stats(req.query.limit);
      return success(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getFullGraph(req, res, next) {
    try {
      const result = await graphService.fullGraph();
      return success(res, result);
    } catch (error) {
      next(error);
    }
  },

  async rebuild(req, res, next) {
    try {
      const result = await graphService.rebuild();
      return success(res, result, "Graph snapshot rebuilt");
    } catch (error) {
      next(error);
    }
  },
};
