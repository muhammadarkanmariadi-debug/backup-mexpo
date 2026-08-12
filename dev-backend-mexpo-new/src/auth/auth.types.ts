import { Request } from 'express';
import { Payload } from '../helper/jwt.strategy';

export interface AuthRequest extends Request {
  user: Payload;
}
