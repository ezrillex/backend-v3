import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  onModuleInit() {
    console.log('Initializing Prisma Service');
    // await this.$connect();
    // console.log('Prisma Service Connected');
  }
}
