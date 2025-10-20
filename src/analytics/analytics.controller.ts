import { Controller, HttpCode, Param, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @AllowAnonymous()
  @HttpCode(204)
  @Post('like/:id')
  async likePost(@Param('id') id: string) {
    await this.analyticsService.likePost(id);
  }

  @AllowAnonymous()
  @Post('view_video_post/:id')
  viewVideoPost(@Param('id') id: string) {
    return this.analyticsService.analyticsTrackViewPost(id);
  }
}
