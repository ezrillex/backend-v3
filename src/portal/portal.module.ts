import { Module } from '@nestjs/common';
import { PortalService } from './portal.service';
import { PortalController } from './portal.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PortalController],
  providers: [PortalService, PrismaService],
})
export class PortalModule {}
