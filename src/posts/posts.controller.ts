import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreateVideoRepost } from './dto/create-video.repost';
import { UpdatePostDto } from './dto/update-post.dto';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedAccount } from '../auth/AuthenticatedAccount';
import { CreateTextPost } from './dto/createTextPost';
import { CreateVideoPost } from './dto/CreateVideoPost';
import { AdminGuard } from '../auth/admin/admin.guard';
import { SubmitHostedVideoPost } from './dto/SubmitHostedVideoPost';

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
  findAll() {
    return this.postsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postsService.update(+id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(+id);
  }
}
