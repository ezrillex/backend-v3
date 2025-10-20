import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const auth: string | undefined = request.headers['authorization'];
    if (!auth) return false;

    if (!auth.startsWith('Bearer ')) return false;
    const token = auth.slice(7);
    const tokenBuff = Buffer.from(token, 'utf8');
    const adminBuff = Buffer.from(process.env.ADMIN_TOKEN as string, 'utf-8');
    if (tokenBuff.length !== adminBuff.length) return false;
    return timingSafeEqual(tokenBuff, adminBuff);
  }
}
