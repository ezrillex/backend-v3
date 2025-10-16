import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('home')
  async getHome() {
    return this.appService.getHomePage();
  }

  @Get('dev')
  async dev() {
    return this.prisma.managedFile.findMany({
      where: {
        thumbnails: { none: {} },
        torrents: { none: {} },
        avatars: { none: {} },
      },
      include: {
        thumbnails: true,
        avatars: true,
        torrents: true,
      },
    });
  }
}
