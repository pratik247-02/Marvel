import { StatusCodes } from "http-status-codes";

/**
 * Send a success response
 * @param {import("express").Response} res
 * @param {object} data
 * @param {string} message
 * @param {number} statusCode
 */
export const sendSuccess = (
  res,
  data = null,
  message = "Success",
  statusCode = StatusCodes.OK
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send a created response
 * @param {import("express").Response} res
 * @param {object} data
 * @param {string} message
 */
export const sendCreated = (res, data = null, message = "Created successfully") => {
  return sendSuccess(res, data, message, StatusCodes.CREATED);
};

/**
 * Send a no content response
 * @param {import("express").Response} res
 */
export const sendNoContent = (res) => {
  return res.status(StatusCodes.NO_CONTENT).send();
};

/**
 * Send paginated response
 * @param {import("express").Response} res
 * @param {object} options
 */
export const sendPaginated = (
  res,
  { data, page, limit, total, message = "Success" }
) => {
  return res.status(StatusCodes.OK).json({
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
};
