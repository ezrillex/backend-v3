import { Module } from '@nestjs/common';
import { PortalService } from './portal.service';
import { PortalController } from './portal.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [PortalController],
  providers: [PortalService],
  imports: [PrismaModule],
})
export class PortalModule {}
