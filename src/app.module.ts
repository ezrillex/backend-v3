import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyticsModule } from './analytics/analytics.module';
import { PostsModule } from './posts/posts.module';
import { PortalModule } from './portal/portal.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { ManagedFilesModule } from './managed-files/managed-files.module';
import { ChannelsModule } from './channels/channels.module';

@Module({
  imports: [
    AnalyticsModule,
    PostsModule,
    PortalModule,
    ScheduleModule.forRoot(),
    PrismaModule,
    ManagedFilesModule,
    ChannelsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
