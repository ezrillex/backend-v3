import { Controller, Get, Param } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { GetChannelById } from './dtos/get-channel-by-id';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get(':id')
  getChannel(@Param() params: GetChannelById) {
    console.log(params);
    return this.channelsService.getChannelById(params.id);
  }
}
