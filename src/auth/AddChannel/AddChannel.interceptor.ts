import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AddChannelInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest<Request>();
    console.log(req['user']);
    const user: string | undefined = req['user'];
    if (!user) {
      throw new InternalServerErrorException(
        'User not available for interceptor.',
      );
    }

    const id: string | undefined = user['id'];
    if (!id) {
      throw new InternalServerErrorException(
        'User id not available for interceptor',
      );
    }

    // not or throw due to new channel onboarding.
    const channel = await this.prisma.channels.findUnique({
      where: {
        userId: id,
      },
    });

    if (channel) {
      req['channel'] = channel;
    } else {
      const created = await this.prisma.channels.create({
        data: {
          userId: id,
          name: 'Canal Nuevo ' + (Math.random() + 1).toString(36).substring(7),
        },
      });
      req['channel'] = {
        ...created,
      };
    }

    return next.handle();
  }
}
