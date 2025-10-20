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
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './auth/auth';

@Module({
  imports: [
    AnalyticsModule,
    PostsModule,
    PortalModule,
    ScheduleModule.forRoot(),
    PrismaModule,
    ManagedFilesModule,
    ChannelsModule,
    AuthModule.forRoot({ auth }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
