import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>(`roles`, context.getHandler());
    if (!roles) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request?.user;
    const rolesToken: string = (user as { role?: string })?.role || ``;
    const arrRoles = rolesToken.split(',');
    return roles.some((role) => arrRoles.includes(role));
  }
}

export const Roles = (...roles: string[]) => {
  return SetMetadata(`roles`, roles);
};
