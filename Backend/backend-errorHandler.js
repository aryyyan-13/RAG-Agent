import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  // Default error object
  const error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500,
    timestamp: new Date().toISOString(),
  };

  // Log error
  if (error.status >= 500) {
    logger.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      query: req.query,
    });
  } else {
    logger.warn('Client Error:', {
      message: err.message,
      status: error.status,
      path: req.path,
    });
  }

  // Handle specific error types
  if (err.code === 'MULTER_FILE_TOO_LARGE') {
    error.message = 'File too large (max 50MB)';
    error.status = 413;
  }

  if (err.code === 'EBADCSRFTOKEN') {
    error.message = 'Invalid CSRF token';
    error.status = 403;
  }

  if (err.name === 'ValidationError') {
    error.message = err.message || 'Validation failed';
    error.status = 400;
  }

  if (err.name === 'UnauthorizedError') {
    error.message = 'Unauthorized';
    error.status = 401;
  }

  // Send error response
  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { details: err.stack }),
  });
};

// Async error wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
