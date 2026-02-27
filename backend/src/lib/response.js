// ─── Helper: Respuestas JSON estandarizadas ─────────────────────────────────

/**
 * Respuesta exitosa
 * @param {import('express').Response} res
 * @param {any} data
 * @param {number} statusCode
 */
export function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Respuesta de error
 * @param {import('express').Response} res
 * @param {string} error
 * @param {string} message
 * @param {number} statusCode
 */
export function sendError(res, error, message, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    error,
    message,
  });
}
