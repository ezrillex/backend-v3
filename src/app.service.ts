import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { fileMetaToUrl } from './utils/utils';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('* * * * *')
  system() {
    const usage = process.memoryUsage();
    const usedMB = (usage.heapUsed / 1_000_000).toFixed(2);
    const totalMB = (usage.heapTotal / 1_000_000).toFixed(2);
    const heapUsage = ((usage.heapUsed / usage.heapTotal) * 100).toFixed(2);
    const systemUsage = ((usage.heapUsed / 512_000_000) * 100).toFixed(2);
    console.log(
      `Heap Usage: ${heapUsage}% (${usedMB}/${totalMB} MB) | Memory Usage: ${systemUsage}% (${usedMB}/512 MB)`,
    );
  }

  async getHomePage(): Promise<object> {
    let data = await this.prisma.posts.findMany({
      where: {
        type: 'Video',
      },
      select: {
        id: true,
        type: true,
        title: true,
        channels: true,
        video: {
          select: {
            duration: true,
            thumbnailFile: true,
            views: true,
          },
        },
        image: true,
        text: true,
        imageText: true,
        audio: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 11,
    });

    // todo count how many records, choose 5 at random through a randomizer
    const channels = await this.prisma.channels.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      take: 5,
    });

    return {
      latest: data.map((post) => {
        const clean = {
          id: post.id,
          type: post.type,
          createdAt: post.createdAt,
          channel: {
            id: post.channels.id,
            name: post.channels.name,
            avatar: post.channels.avatar,
          },
        };
        switch (post.type) {
          case 'Video':
            if (post.video) { // so the complier stops complaining
              clean['video'] = {
                duration: post.video.duration,
                thumbnail: fileMetaToUrl(post.video.thumbnailFile),
                views: post.video.views.toString(), // cast to string
              };
            }
        }

        return clean;
      }),
      channels: channels.map((channel) => {
        return {
          id: channel.id,
          name: channel.name,
          avatar: channel.avatar,
          postsCount: channel._count.posts,
        };
      }),
    };
  }
}
