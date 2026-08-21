import Artifact from "./artifact.model.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { updateWithVersion } from "../../utils/concurrency.js";

export const artifactService = {
  async findAll(query = {}) {
    const {
      page = 1,
      limit = 10,
      sort = "name",
      search,
      status,
      ...filters
    } = query;

    const skip = (page - 1) * limit;

    const queryObj = { ...filters };

    if (search) {
      queryObj.$text = { $search: search };
    }

    if (status) {
      queryObj.status = status;
    }

    const [artifacts, total] = await Promise.all([
      Artifact.find(queryObj)
        .populate("holders", "name alias image")
        .populate("appearances", "title releaseYear poster")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Artifact.countDocuments(queryObj),
    ]);

    return {
      data: artifacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id) {
    const artifact = await Artifact.findById(id)
      .populate("holders", "name alias image description powers")
      .populate("appearances", "title releaseYear poster phase");

    if (!artifact) {
      throw new AppError("Artifact not found", 404);
    }

    return artifact;
  },

  async create(data) {
    const artifact = await Artifact.create(data);
    return artifact;
  },

  async update(id, data) {
    // Honours `expectedVersion` when supplied, returning 409 instead of
    // silently overwriting a concurrent edit.
    return updateWithVersion(Artifact, id, data, "Artifact");
  },

  async delete(id) {
    const artifact = await Artifact.findByIdAndDelete(id);

    if (!artifact) {
      throw new AppError("Artifact not found", 404);
    }

    return artifact;
  },
};
