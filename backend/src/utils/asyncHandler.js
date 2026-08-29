/**
 * Wraps an async route handler so any rejected promise / thrown error
 * is automatically forwarded to Express's error-handling middleware,
 * instead of needing try/catch in every controller function.
 *
 * Usage: router.get('/', asyncHandler(async (req, res) => { ... }));
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
