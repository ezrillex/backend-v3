import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PortalService } from './portal.service';
import { UpdateChannel } from './dtos/updateChannel/updateChannel';
import { GetPostsPaginated } from './dtos/getPostsPaginated/getPostsPaginated';
import { AuthenticatedAccount } from '../auth/AuthenticatedAccount';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { PrismaService } from '../prisma/prisma.service';
import { AdminGuard } from '../auth/admin/admin.guard';
import { AddChannelInterceptor } from '../auth/AddChannel/AddChannel.interceptor';

@Controller('portal')
export class PortalController {
  constructor(
    private readonly portalService: PortalService,
    private readonly prisma: PrismaService,
  ) {}

  @UseInterceptors(AddChannelInterceptor)
  @Get('channel')
  async getChannel(@Req() request: AuthenticatedAccount) {
    return {
      name: request.channel.name,
      avatar: await this.portalService.getAvatar(request.channel.avatarFileId),
    };
  }

  @HttpCode(200)
  @UseInterceptors(AddChannelInterceptor)
  @Patch('channel')
  async updateChannel(
    @Req() request: AuthenticatedAccount,
    @Body() body: UpdateChannel,
  ) {
    return this.portalService.updateChannel(request.channel.id, body);
  }

  @UseInterceptors(AddChannelInterceptor)
  @Get('posts')
  getPosts(
    @Req() request: AuthenticatedAccount,
    @Query() query: GetPostsPaginated,
  ) {
    return this.portalService.getPosts(request.channel.id, query.page);
  }

  @UseInterceptors(AddChannelInterceptor)
  @Get('stats')
  getStats(@Req() request: AuthenticatedAccount) {
    return this.portalService.getStats(request.channel.id);
  }

  // todo admin only token protected.
  @AllowAnonymous()
  @UseGuards(AdminGuard)
  @UseInterceptors(AddChannelInterceptor)
  @Post('test')
  inviteUser() {
    return 'testing 123';
    // return this.prisma.user.create({
    //   data: {
    //     id: randomUUID(),
    //     name: 'Juan Gomez',
    //     email: 'ezra.alejandro.abarca.cordova@gmail.com',
    //   },
    // });
  }
}
