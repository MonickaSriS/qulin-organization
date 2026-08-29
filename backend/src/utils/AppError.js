/**
 * Custom error class carrying an HTTP status and a machine-readable code,
 * matching the {error: {code, message}} response shape agreed in the
 * API contract (docs/api-contract.md, Section 4).
 *
 * Usage: throw new AppError(404, 'NOT_FOUND', 'Ingredient not found');
 */
export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
