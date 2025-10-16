import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { fileMetaToUrlFallback } from '../utils/utils';
import { UpdateChannel } from './dtos/updateChannel/updateChannel';
import { validateImage } from '../utils/utils';
import { ManagedFilesService } from '../managed-files/managed-files.service';

@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: ManagedFilesService,
  ) {}

  async updateChannel(id: string, data: UpdateChannel) {
    let changes = false;
    const newData = {};
    if (data.newChannelName) {
      changes = true;
      newData['name'] = data.newChannelName;
    }

    if (data.newThumbnail) {
      changes = true;
      const img = await validateImage(data.newThumbnail); // todo adjust parameters i.e. the dimensionss xy
      const file = await this.files.createManagedFile('img', img, true);
      // todo set the old file to be removed i.e. call files remove method.
      newData['avatarFileId'] = file.id;
    }

    if (changes) {
      return this.prisma.channels.update({
        where: {
          id: id,
        },
        data: newData,
      });
    } else {
      return 'No changes provided!';
    }
  }

  async getAvatar(id: string | null) {
    if (id) {
      const data = await this.prisma.managedFile.findUnique({
        where: { id: id },
      });

      return fileMetaToUrlFallback(
        data,
        'https://redacted.invalid/img/default_avatar.webp',
      );
    } else {
      return 'https://redacted.invalid/img/default_avatar.webp'; // todo use .env for this value
    }
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
        video: {
          type: 'HostedVideo',
        },
      },
    });

    // external videos count
    const youtubeRepostCount = await this.prisma.posts.count({
      where: {
        channelsId: channelId,
        video: {
          type: 'YoutubeRepost',
        },
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
      youtubeRepostCount,
    };
  }

  async getPosts(channelId: string, page: number) {
    // todo filtering support or reorder
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
