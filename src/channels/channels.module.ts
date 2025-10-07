import { Module } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [ChannelsController],
  providers: [ChannelsService],
  imports: [PrismaModule],
})
export class ChannelsModule {}
