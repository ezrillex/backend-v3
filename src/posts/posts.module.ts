import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [PostsController],
  providers: [PostsService],
  imports: [HttpModule, PrismaModule],
})
export class PostsModule {}
