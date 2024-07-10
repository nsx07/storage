import { validateTokenProvider } from "./../core/auth.js";
import { NextFunction, Request, Response } from "express";

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  const valid = validateTokenProvider(req.headers.token as string);

  if (valid.success || process.env.BYPASS === "true") {
    return next();
  }

  return res.status(401).json(valid);
};
