import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Cron } from '@nestjs/schedule';
import { fileMetaToUrl, fileMetaToUrlFallback } from './utils/utils';

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
    const data = await this.prisma.posts.findMany({
      select: {
        id: true,
        type: true,
        title: true,
        channels: {
          select: {
            id: true,
            name: true,
            avatarFile: true,
          },
        },
        video: {
          select: {
            duration: true,
            thumbnailFile: true,
            views: true,
          },
        },
        image: true,
        text: {
          select: {
            text: true,
          },
        },
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
        avatarFile: true,
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
            avatar: fileMetaToUrlFallback(
              post.channels.avatarFile,
              'https://dev-vcris.25127928.xyz/img/default_avatar.webp', // todo use .env to configure this
            ),
          },
        };
        if (post.video) {
          // so the complier stops complaining
          clean['video'] = {
            duration: post.video.duration,
            thumbnail: fileMetaToUrl(post.video.thumbnailFile),
            views: post.video.views.toString(), // cast to string
          };
        }

        if (post.text) {
          clean['text'] = {
            text: post.text.text,
          };
        }

        return clean;
      }),
      channels: channels.map((channel) => {
        return {
          id: channel.id,
          name: channel.name,
          avatar: fileMetaToUrlFallback(
            channel.avatarFile,
            'https://dev-vcris.25127928.xyz/img/default_avatar.webp', // todo use .env for this value
          ),
          postsCount: channel._count.posts,
        };
      }),
    };
  }
}
