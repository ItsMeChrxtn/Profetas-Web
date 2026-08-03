export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: 'Not found.' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File is too large (max 5MB).' });
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({ success: false, message: 'Not found.' });
  }

  const status = err.status || 500;
  const message = err.expose ? err.message : status === 500 ? 'Something went wrong. Please try again.' : err.message;
  res.status(status).json({ success: false, message });
}
