const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error to console for developers
  console.error(err);

  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    error.statusCode = 404;
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    error.message = 'Duplicate field value entered';
    error.statusCode = 400;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map((val) => val.message).join(', ');
    error.statusCode = 400;
  }

  res.status(err.statusCode || error.statusCode || 500).json({
    message: error.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
