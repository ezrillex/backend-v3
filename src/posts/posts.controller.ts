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
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreateVideoRepost } from './dto/CreateVideoRepost';
import { UpdatePostDto } from './dto/UpdatePostDto';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedAccount } from '../auth/AuthenticatedAccount';
import { CreateTextPost } from './dto/createTextPost';
import { CreateVideoPost } from './dto/CreateVideoPost';
import { AdminGuard } from '../auth/admin/admin.guard';
import { SubmitHostedVideoPost } from './dto/SubmitHostedVideoPost';
import { GetAllVideosFilterSort } from './dto/GetAllVideosFilterSort';
import { SortBy } from './entities/sortBy.enum';
import { SortOrder } from './entities/sortOrder.enum';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(AuthGuard)
  @Post('video/youtube')
  createRepost(
    @Req() request: AuthenticatedAccount,
    @Body() data: CreateVideoRepost,
  ) {
    return this.postsService.createVideoRepost(request.channel.id, data);
  }

  @UseGuards(AuthGuard)
  @Post('video/hosted')
  createVideoPost(
    @Req() request: AuthenticatedAccount,
    @Body() data: CreateVideoPost,
  ) {
    return this.postsService.createVideoPost(request.channel.id, data);
  }

  // for submitting torrent to a hosted video
  @UseGuards(AdminGuard)
  @Post('video/hosted/submit')
  uploadTorrentToVideo(@Body() data: SubmitHostedVideoPost) {
    return this.postsService.submitHostedVideo(data);
  }

  @UseGuards(AuthGuard)
  @Post('text')
  createTextPost(
    @Req() request: AuthenticatedAccount,
    @Body() data: CreateTextPost,
  ) {
    return this.postsService.createTextPost(request.channel.id, data);
  }

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

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string) {
    return this.postsService.remove(+id);
  }
}
