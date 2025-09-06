import { Controller, HttpCode, Param, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @HttpCode(204)
  @Post('like/:id')
  async likePost(@Param('id') id: string) {
    await this.analyticsService.likePost(id);
  }

  @Post('view_video_post/:id')
  viewVideoPost(@Param('id') id: string) {
    return this.analyticsService.viewVideoPost(id);
  }
}
