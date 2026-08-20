import Team from "./team.model.js";
import { AppError } from "../../middlewares/errorHandler.js";

export const teamService = {
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

    const [teams, total] = await Promise.all([
      Team.find(queryObj)
        .populate("members", "name alias image")
        .populate("leaders", "name alias image")
        .populate("appearances", "title releaseYear poster")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Team.countDocuments(queryObj),
    ]);

    return {
      data: teams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id) {
    const team = await Team.findById(id)
      .populate("members", "name alias image description powers stats")
      .populate("leaders", "name alias image description")
      .populate("appearances", "title releaseYear poster phase synopsis");

    if (!team) {
      throw new AppError("Team not found", 404);
    }

    return team;
  },

  async create(data) {
    const team = await Team.create(data);
    return team;
  },

  async update(id, data) {
    const team = await Team.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!team) {
      throw new AppError("Team not found", 404);
    }

    return team;
  },

  async delete(id) {
    const team = await Team.findByIdAndDelete(id);

    if (!team) {
      throw new AppError("Team not found", 404);
    }

    return team;
  },

  async addMember(id, memberId) {
    const team = await Team.findByIdAndUpdate(
      id,
      { $addToSet: { members: memberId } },
      { new: true }
    ).populate("members", "name alias image");

    if (!team) {
      throw new AppError("Team not found", 404);
    }

    return team;
  },

  async removeMember(id, memberId) {
    const team = await Team.findByIdAndUpdate(
      id,
      { $pull: { members: memberId } },
      { new: true }
    ).populate("members", "name alias image");

    if (!team) {
      throw new AppError("Team not found", 404);
    }

    return team;
  },
};
