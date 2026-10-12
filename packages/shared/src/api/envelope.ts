/**
 * REST envelope — matches docs/api-reference.md and the current Fastify handlers.
 */

export interface ApiSuccess<T> {
  statusCode: number;
  message?: string;
  data: T;
}

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  /** Field-level validation errors (Zod flatten): `{ email: ["..."] }` */
  details?: Record<string, string[]>;
}
