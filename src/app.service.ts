import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

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
            thumbnail: true,
            views: true,
          },
        },
        short: true,
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

    // todo remove this later
    data = [...data, ...data, ...data, ...data];
    data.pop();

    // todo count how many records, choose 5 at random through a randomizer
    let channels = await this.prisma.channels.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      take: 5,
    });
    // todo undo this was just for testing
    channels = [
      ...channels,
      ...channels,
      ...channels,
      ...channels,
      ...channels,
    ];

    return {
      latest: data.map((post) => {
        const clean = {
          id: post.id,
          type: post.type,
          createdAt: post.createdAt,
          channel: post.channels,
        };
        switch (post.type) {
          case 'Video':
            clean['video'] = {
              ...post.video,
              views: post.video?.views?.toString(), // cast to string
            };
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
