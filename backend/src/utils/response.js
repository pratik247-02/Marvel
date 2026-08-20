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

/**
 * Short aliases used by the module controllers.
 *
 * `paginated` adapts the (res, data, pagination) call shape the controllers use
 * to the options-object shape `sendPaginated` expects. Services return
 * `{ page, limit, total, pages }`, so `pages` is carried through as `totalPages`.
 *
 * @param {import("express").Response} res
 * @param {Array} data
 * @param {{ page: number, limit: number, total: number, pages?: number }} pagination
 * @param {string} message
 */
export const paginated = (res, data, pagination = {}, message = "Success") => {
  const { page = 1, limit = 10, total = 0 } = pagination;
  return sendPaginated(res, { data, page, limit, total, message });
};

export const success = sendSuccess;
export const created = sendCreated;
export const noContent = sendNoContent;
