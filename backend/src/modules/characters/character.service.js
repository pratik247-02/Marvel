import Character from "./character.model.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { updateWithVersion } from "../../utils/concurrency.js";

export const characterService = {
  async findAll(query = {}) {
    const {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      search,
      ...filters
    } = query;

    const skip = (page - 1) * limit;

    const queryObj = { ...filters };

    // Text search
    if (search) {
      queryObj.$text = { $search: search };
    }

    const [characters, total] = await Promise.all([
      Character.find(queryObj)
        .populate("appearances", "title releaseYear poster")
        .populate("artifactsUsed", "name image")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Character.countDocuments(queryObj),
    ]);

    return {
      data: characters,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id) {
    const character = await Character.findById(id)
      .populate("affiliations", "name alias image")
      .populate("appearances", "title releaseYear poster phase")
      .populate("artifactsUsed", "name description image status");

    if (!character) {
      throw new AppError("Character not found", 404);
    }

    return character;
  },

  async create(data) {
    const character = await Character.create(data);
    return character;
  },

  async update(id, data) {
    // Honours `expectedVersion` when the caller sends one, returning 409
    // rather than silently overwriting a concurrent edit.
    return updateWithVersion(Character, id, data, "Character");
  },

  async delete(id) {
    const character = await Character.findByIdAndDelete(id);

    if (!character) {
      throw new AppError("Character not found", 404);
    }

    return character;
  },

  async addSection(id, sectionData) {
    const character = await Character.findByIdAndUpdate(
      id,
      { $push: { sections: sectionData } },
      { new: true, runValidators: true }
    );

    if (!character) {
      throw new AppError("Character not found", 404);
    }

    return character;
  },
};