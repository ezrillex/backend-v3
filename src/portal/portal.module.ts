import { Module } from '@nestjs/common';
import { PortalService } from './portal.service';
import { PortalController } from './portal.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ManagedFilesService } from '../managed-files/managed-files.service';

@Module({
  controllers: [PortalController],
  providers: [PortalService, ManagedFilesService],
  imports: [PrismaModule],
})
export class PortalModule {}
