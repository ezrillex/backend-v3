import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}
  async getChannelById(id: string) {
    // info to show: posts separated by tabs?
    // todo include channel avatar url. and stats of channel?
    const data = await this.prisma.channels.findUniqueOrThrow({
      where: { id },
      include: {
        posts: {
          include: {
            video: true,
            image: true,
            text: true,
            imageText: true,
            audio: true,
          },
        },
      },
    });

    return {
      ...data,
      posts: data.posts.map((post) => {
        return {
          ...post,
          views: post.views.toString(),
          likes: post.likes.toString(),
        };
      }),
    };
  }
}
