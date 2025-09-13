import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AnalyticsModule } from './analytics/analytics.module';
import { PostsModule } from './posts/posts.module';
import { PortalModule } from './portal/portal.module';

@Module({
  imports: [AnalyticsModule, PostsModule, PortalModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
