import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyticsModule } from './analytics/analytics.module';
import { PostsModule } from './posts/posts.module';
import { PortalModule } from './portal/portal.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    AnalyticsModule,
    PostsModule,
    PortalModule,
    ScheduleModule.forRoot(),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
