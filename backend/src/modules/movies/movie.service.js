import Movie from "./movie.model.js";
import { AppError } from "../../middlewares/errorHandler.js";

export const movieService = {
  async findAll(query = {}) {
    const {
      page = 1,
      limit = 10,
      sort = "releaseYear",
      search,
      phase,
      ...filters
    } = query;

    const skip = (page - 1) * limit;

    let queryObj = { ...filters };

    if (search) {
      queryObj.$text = { $search: search };
    }

    if (phase) {
      queryObj.phase = phase;
    }

    const [movies, total] = await Promise.all([
      Movie.find(queryObj)
        .populate("characters", "name alias image")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Movie.countDocuments(queryObj),
    ]);

    return {
      data: movies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id) {
    const movie = await Movie.findById(id).populate(
      "characters",
      "name alias image description powers stats"
    );

    if (!movie) {
      throw new AppError("Movie not found", 404);
    }

    return movie;
  },

  async create(data) {
    const movie = await Movie.create(data);
    return movie;
  },

  async update(id, data) {
    const movie = await Movie.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      throw new AppError("Movie not found", 404);
    }

    return movie;
  },

  async delete(id) {
    const movie = await Movie.findByIdAndDelete(id);

    if (!movie) {
      throw new AppError("Movie not found", 404);
    }

    return movie;
  },

  async getByPhase(phase) {
    const movies = await Movie.find({ phase })
      .populate("characters", "name alias image")
      .sort("releaseYear");

    return movies;
  },

  async getTimeline() {
    const movies = await Movie.find()
      .select("title releaseYear phase poster")
      .sort("releaseYear");

    return movies;
  },
};
