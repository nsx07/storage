import { NextFunction, Request, Response } from "express";
import { CacheService } from "../services/CacheService.js";

export const cache = {
  open: async (req: Request, res: Response, next: NextFunction) => {
    console.log("Opening cache");

    await CacheService.connect(
      process.env["REDIS_URL"]
        ? { url: process.env["REDIS_URL"] as string }
        : undefined
    );

    next();
  },
  close: async (req: Request, res: Response, next: NextFunction) => {
    console.log("Closing cache");
    await CacheService.disconnect();
  },
};
