import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PortalService } from './portal.service';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateChannel } from './dtos/updateChannel/updateChannel';
import { GetPostsPaginated } from './dtos/getPostsPaginated/getPostsPaginated';

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
    @Body() body: UpdateChannel,
  ) {
    await this.portalService.updateChannel(
      request.channel.id,
      body.newChannelName,
    );
  }

  //todo update channel avatar

  @UseGuards(AuthGuard)
  @Get('posts')
  getPosts(
    @Req() request: AuthenticatedAccount,
    @Query() query: GetPostsPaginated,
  ) {
    return this.portalService.getPosts(request.channel.id, query.page);
  }

  @UseGuards(AuthGuard)
  @Get('stats')
  getStats(@Req() request: AuthenticatedAccount) {
    return this.portalService.getStats(request.channel.id);
  }
}
