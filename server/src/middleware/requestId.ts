import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const attachRequestId = (req: Request, _res: Response, next: NextFunction): void => {
  req.requestId = uuidv4();
  next();
};
