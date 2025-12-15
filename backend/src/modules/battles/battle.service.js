import Battle from "./battle.model.js";
import { AppError } from "../../middlewares/errorHandler.js";

export const battleService = {
  async findAll(query = {}) {
    const {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      search,
      movie,
      significance,
      ...filters
    } = query;

    const skip = (page - 1) * limit;

    let queryObj = { ...filters };

    if (search) {
      queryObj.$text = { $search: search };
    }

    if (movie) {
      queryObj.movie = movie;
    }

    if (significance) {
      queryObj.significance = significance;
    }

    const [battles, total] = await Promise.all([
      Battle.find(queryObj)
        .populate("participants", "name alias image")
        .populate("movie", "title releaseYear poster")
        .populate("winner", "name alias image")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Battle.countDocuments(queryObj),
    ]);

    return {
      data: battles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id) {
    const battle = await Battle.findById(id)
      .populate("participants", "name alias image description powers stats")
      .populate("movie", "title releaseYear poster phase synopsis")
      .populate("winner", "name alias image");

    if (!battle) {
      throw new AppError("Battle not found", 404);
    }

    return battle;
  },

  async create(data) {
    const battle = await Battle.create(data);
    return battle;
  },

  async update(id, data) {
    const battle = await Battle.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!battle) {
      throw new AppError("Battle not found", 404);
    }

    return battle;
  },

  async delete(id) {
    const battle = await Battle.findByIdAndDelete(id);

    if (!battle) {
      throw new AppError("Battle not found", 404);
    }

    return battle;
  },

  async findByMovie(movieId) {
    const battles = await Battle.find({ movie: movieId })
      .populate("participants", "name alias image")
      .populate("winner", "name alias image")
      .sort("name");

    return battles;
  },

  async findByCharacter(characterId) {
    const battles = await Battle.find({ participants: characterId })
      .populate("participants", "name alias image")
      .populate("movie", "title releaseYear poster")
      .populate("winner", "name alias image")
      .sort("-createdAt");

    return battles;
  },
};
