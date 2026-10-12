import { env } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  const response = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      statusCode,
      ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  };

  if (statusCode === 500) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json(response);
};
