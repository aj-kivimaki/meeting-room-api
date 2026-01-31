import { RequestHandler } from "express";

export const asyncHandler = (
  fn: (...args: Parameters<RequestHandler>) => unknown,
): RequestHandler => {
  return (req, res, next) => {
    try {
      const maybe = fn(req, res, next);
      if (maybe && typeof (maybe as any).then === "function") {
        (maybe as Promise<unknown>).catch(next);
      }
    } catch (err) {
      next(err);
    }
  };
};
