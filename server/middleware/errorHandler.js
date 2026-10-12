export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === 11000) {
    return res.status(409).json({ message: 'An account or record with that value already exists.' });
  }
  const status = error.status || (error.name === 'ValidationError' ? 400 : 500);
  const message = status >= 500 ? 'Something went wrong. Please try again.' : error.message;
  if (status >= 500) console.error(error.message);
  res.status(status).json({ message });
}