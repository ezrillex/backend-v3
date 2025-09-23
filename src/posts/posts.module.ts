import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';
import { ManagedFilesModule } from '../managed-files/managed-files.module';

@Module({
  controllers: [PostsController],
  providers: [PostsService],
  imports: [HttpModule, PrismaModule, ManagedFilesModule],
})
export class PostsModule {}
