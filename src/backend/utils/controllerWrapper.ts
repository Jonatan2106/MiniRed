import { NextFunction, Request, Response } from "express";

type ExpressRouteHandler<T> = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<T> | T;

export function controllerWrapper<T>(routeHandler: ExpressRouteHandler<T>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await routeHandler(req, res, next);
      // Jika handler sudah mengirim respons, jangan kirim ulang
      if (res.headersSent) return;
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}