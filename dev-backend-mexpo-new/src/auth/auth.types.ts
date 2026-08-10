import { Request } from 'express';
import { Payload } from 'src/helper/jwt.strategy';

export interface AuthRequest extends Request {
  user: Payload;
}
