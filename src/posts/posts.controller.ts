import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreateVideoRepost } from './dto/CreateVideoRepost';
import { UpdatePostDto } from './dto/UpdatePostDto';
import { AuthenticatedAccount } from '../auth/AuthenticatedAccount';
import { CreateTextPost } from './dto/createTextPost';
import { CreateVideoPost } from './dto/CreateVideoPost';
import { AdminGuard } from '../auth/admin/admin.guard';
import { SubmitHostedVideoPost } from './dto/SubmitHostedVideoPost';
import { GetAllVideosFilterSort } from './dto/GetAllVideosFilterSort';
import { SortBy } from './entities/sortBy.enum';
import { SortOrder } from './entities/sortOrder.enum';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { AddChannelInterceptor } from '../auth/AddChannel/AddChannel.interceptor';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseInterceptors(AddChannelInterceptor)
  @Post('video/youtube')
  createRepost(
    @Req() request: AuthenticatedAccount,
    @Body() data: CreateVideoRepost,
  ) {
    return this.postsService.createVideoRepost(request.channel.id, data);
  }

  @UseInterceptors(AddChannelInterceptor)
  @Post('video/hosted')
  createVideoPost(
    @Req() request: AuthenticatedAccount,
    @Body() data: CreateVideoPost,
  ) {
    return this.postsService.createVideoPost(request.channel.id, data);
  }

  // for submitting torrent to a hosted video
  @AllowAnonymous() // skip better auth.
  @UseGuards(AdminGuard)
  @Post('video/hosted/submit')
  uploadTorrentToVideo(@Body() data: SubmitHostedVideoPost) {
    return this.postsService.submitHostedVideo(data);
  }

  @UseInterceptors(AddChannelInterceptor)
  @Post('text')
  createTextPost(
    @Req() request: AuthenticatedAccount,
    @Body() data: CreateTextPost,
  ) {
    return this.postsService.createTextPost(request.channel.id, data);
  }

  @AllowAnonymous()
  @Get()
  findAll(@Query() params: GetAllVideosFilterSort) {
    // set defaults for missing params
    params.page = params.page ?? 0;
    params.type = params.type ?? [];
    if (!Array.isArray(params.type)) {
      params.type = [params.type];
    }
    params.sortBy = params.sortBy ?? SortBy.PublishedDate;
    params.sortOrder = params.sortOrder ?? SortOrder.DESC;
    return this.postsService.findAll(params);
  }

  @AllowAnonymous()
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string) {
    return this.postsService.findOne(id);
  }

  @UseInterceptors(AddChannelInterceptor)
  @Patch(':id')
  update(
    @Req() request: AuthenticatedAccount,
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, updatePostDto, request.channel.id);
  }

  // todo add check for if post belongs to channel
  @UseInterceptors(AddChannelInterceptor)
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string) {
    return this.postsService.remove(+id);
  }
}
