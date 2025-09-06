import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // todo refactor into service and cron that updates as to not trigger recalculation on simultaneous request when ttl expired.
  cache: object | null = null;
  ttl: number | null = null;
  @Get('home')
  async getHome(): Promise<object> {
    if (this.cache && this.ttl) {
      // 10 min
      if (Date.now() - this.ttl < 600_000) {
        return this.cache;
      }
    }

    const data = await this.prisma.posts.findMany({
      where: {
        type: 'Video',
      },
      select: {
        id: true,
        type: true,
        Channels: true,
        video: true, // todo bring only key data
        short: true,
        image: true,
        text: true,
        imageText: true,
        audio: true,
      },
    });

    const cleanData = data.map((post) => {
      return {
        ...post, // copia todo modificar para literal solo traer lo que hay que traer
        video: {
          ...post.video,
          views: post.video?.views?.toString(), // casteo a string
        },
      };
    });

    this.cache = cleanData;
    this.ttl = Date.now();
    return cleanData;
  }
}
