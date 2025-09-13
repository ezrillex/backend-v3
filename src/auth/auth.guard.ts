import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { FastifyRequest } from 'fastify';
import { PrismaService } from '../prisma/prisma.service';

// const clerkClient = createClerkClient({
//   secretKey: process.env.CLERK_SECRET_KEY,
// });

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    if (request.headers.authorization) {
      try {
        const token = request.headers.authorization.slice(7);
        const data = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
          authorizedParties: ['http://localhost:5173'],
        });
        // console.log(data);
        request['auth'] = data; // attach Clerk session info

        // const user = await clerkClient.users.getUser(data.sub);
        // console.log(user);

        const channel = await this.prisma.channels.findFirst({
          where: {
            clerkId: data.sub,
          },
        });

        if (channel) {
          request['channel'] = channel;
        } else {
          const created = await this.prisma.channels.create({
            data: {
              clerkId: data.sub,
              name:
                'Canal Nuevo ' + (Math.random() + 1).toString(36).substring(7),
              // todo default avatar ?
            },
          });
          request['channel'] = {
            ...created,
            firstLogin: true,
          };
        }

        return true;
      } catch (err) {
        // console.log(err);
        // console.log(typeof err);
        throw new UnauthorizedException('Invalid or expired token');
      }
    } else {
      throw new UnauthorizedException('Missing token');
    }
  }
}
