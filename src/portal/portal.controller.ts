import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PortalService } from './portal.service';
import { AuthGuard } from '../auth/auth.guard';
import { ChannelPost } from './dtos/channelpost/channelPost';

type AuthenticatedAccount = {
  channel: { id: string; name: string; avatar: string };
  auth: object;
};

@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @UseGuards(AuthGuard)
  @Get('channel')
  getChannel(@Req() request: AuthenticatedAccount) {
    return {
      name: request.channel.name,
      avatar: request.channel.avatar,
    };
  }

  @HttpCode(204)
  @UseGuards(AuthGuard)
  @Post('channel')
  async updateChannel(
    @Req() request: AuthenticatedAccount,
    @Body() body: ChannelPost,
  ) {
    await this.portalService.updateChannel(
      request.channel.id,
      body.newChannelName,
    );
  }
}
