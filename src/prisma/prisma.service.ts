import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    console.log('Initializing Prisma Service');
    await this.$connect();
    console.log('Prisma Service Connected');
  }
}
