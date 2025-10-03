import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { FastifyRequest } from 'fastify';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    if (request.headers.authorization) {
      const token = request.headers.authorization.slice(7);
      if (token === process.env.ADMIN_TOKEN) {
        return true;
      } else {
        return false;
      }
    } else {
      throw new UnauthorizedException('Missing token');
    }
  }
}
