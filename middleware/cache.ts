import { NextFunction, Request, Response } from "express";
import { CacheService } from "../services/CacheService.js";

export const cache = {
  open: async (req: Request, res: Response, next: NextFunction) => {
    console.log("Opening cache");

    !CacheService.isConnected() &&
      (await CacheService.connect(
        process.env["REDIS_URL"]
          ? { url: process.env["REDIS_URL"] as string }
          : undefined
      ));

    next();
  },
  close: async (req: Request, res: Response, next: NextFunction) => {
    console.log("Closing cache");
    setTimeout(() => {
      CacheService.isConnected() && CacheService.disconnect();
    }, 10000);
  },
};
