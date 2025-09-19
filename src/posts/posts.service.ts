import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createPostDto: CreatePostDto) {
    return 'This action adds a new post';
  }

  findAll() {
    return `This action returns all posts`;
  }

  async findOne(id: string) {
    let data = await this.prisma.posts.findFirstOrThrow({
      select: {
        type: true,
        likes: true,
        title: true,
        createdAt: true,
        channels: {
          select: {
            avatar: true,
            name: true,
            id: true,
          },
        },
      },
    });

    const cleanData = {
      type: data.type,
      title: data.title,
      likes: data.likes.toString(),
      createdAt: data.createdAt,
      channel: data.channels as { id: string; name: string; avatar: string },
    };

    switch (data.type) {
      case 'Video': {
        const video = await this.prisma.videoPost.findFirstOrThrow({
          where: {
            postId: id,
          },
        });
        cleanData['video'] = {
          mediaUrl: video.mediaUrl,
          description: video.description,
          duration: video.duration,
          thumbnail: video.thumbnail,
          views: video.views.toString(),
        };
      }
    }

    return cleanData;
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
