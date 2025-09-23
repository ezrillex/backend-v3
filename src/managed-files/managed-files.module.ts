import { Module } from '@nestjs/common';
import { ManagedFilesService } from './managed-files.service';
import { ManagedFilesController } from './managed-files.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [ManagedFilesController],
  providers: [ManagedFilesService],
  imports: [PrismaModule],
})
export class ManagedFilesModule {}
