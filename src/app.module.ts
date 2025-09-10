import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { VideosModule } from './videos/videos.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PostsModule } from './posts/posts.module';

@Module({
  imports: [VideosModule, AnalyticsModule, PostsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
