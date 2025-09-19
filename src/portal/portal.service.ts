import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  updateChannel(id: string, newName: string) {
    return this.prisma.channels.update({
      where: {
        id: id,
      },
      data: {
        name: newName,
      },
    });
  }

  async getStats(channelId: string) {
    // storage used / total limit
    const storeData: { kilobytes: number }[] = await this.prisma.posts.findMany(
      {
        where: {
          channelsId: channelId,
        },
        select: {
          kilobytes: true,
        },
      },
    );
    const storageUsage = storeData.reduce<number>((sum, value) => {
      return sum + value.kilobytes;
    }, 0);
    // hosted videos count
    const hostedVideosCount = await this.prisma.posts.count({
      where: {
        channelsId: channelId,
        type: 'Video',
      },
    });
    // hosted audio posts count, (what could be an external option for this?)
    // images used / total limit
    // external videos count / total limit
    // text posts count / total limit
    // comments per video
    // total comments
    // views today
    // views this week ??
    // total views

    return {
      storageUsed: storageUsage,
      storageLimit: 31_457_280,
      hostedVideosCount,
    };
  }
  // todo filtering support or reorder
  async getPosts(channelId: string, page: number) {
    const page_size = 10;

    const count = await this.prisma.posts.count({
      where: {
        channelsId: channelId,
      },
    });

    const pageCount = Math.ceil(count / page_size);

    if (page > pageCount) {
      return {
        posts: [],
        pageCount,
      };
    }

    // get paginated and or filtered list of posts
    // title of post? type, published date, views, likes, comments
    const data = await this.prisma.posts.findMany({
      where: {
        channelsId: channelId,
      },
      omit: {
        channelsId: true,
      },
      take: page_size,
      skip: page * page_size,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      posts: data.map((item) => {
        return {
          ...item,
          likes: item.likes.toString(),
        };
      }),
      pageCount,
    };
  }
}
