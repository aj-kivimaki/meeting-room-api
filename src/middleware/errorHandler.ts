import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err?.status ?? 500;
  const message = err?.message ?? "Internal Server Error";

  if (status >= 500) {
    // Log unexpected server errors for diagnostics
    // Keep logs server-side; do not leak internals to clients
    console.error(err);
  }

  res.status(status).json({ error: { message, status } });
}
