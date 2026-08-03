/** Express 4 doesn't auto-catch rejected promises from async route handlers - this forwards them to next(). */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
