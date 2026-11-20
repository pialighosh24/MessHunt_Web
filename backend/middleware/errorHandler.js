const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  console.error('API error:', err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map(e => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') || 'Validation error.' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ success: false, message: `A record with this ${field} already exists.` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid identifier provided.' });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }

  const status = err.statusCode || 500;
  res.status(status).json({ success: false, message: err.message || 'Internal server error.' });
};

module.exports = { notFound, errorHandler };
