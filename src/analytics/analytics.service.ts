import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async viewVideoPost(id: string) {
    let views = 0n;
    try {
      const data = await this.prisma.videoPost.findFirstOrThrow({
        where: {
          id: id,
        },
        select: {
          views: true,
        },
      });
      views = data.views;
    } catch (error) {
      console.error(error);
      return new NotFoundException();
    }

    views += 1n;

    await this.prisma.videoPost.update({
      where: {
        id: id,
      },
      data: {
        views: views,
      },
    });
  }

  async likePost(id: string) {
    let likes = 0n;
    try {
      const data = await this.prisma.posts.findFirstOrThrow({
        where: {
          id: id,
        },
        select: {
          likes: true,
        },
      });
      likes = data.likes;
    } catch (err) {
      console.log(err);
      return new NotFoundException();
    }

    likes += 1n;

    await this.prisma.posts.update({
      where: {
        id: id,
      },
      data: {
        likes: likes,
      },
    });
  }
}
