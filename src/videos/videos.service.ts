import { Injectable } from '@nestjs/common';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  create(createVideoDto: CreateVideoDto) {
    return 'This action adds a new video';
  }

  findAll() {
    return `This action returns all videos`;
  }
  // todo refactor this or do more db calls
  async findOne(id: string) {
    const data = await this.prisma.videoPost.findFirstOrThrow({
      where: {
        id: id,
      },
      include: {
        post: {
          include: {
            Channels: true,
          },
        },
      },
    });
    // console.log(data);
    const views = data.views.toString();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const likes = data.post.likes.toString();

    return {
      ...data,
      views: views,
      post: {
        ...data.post,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        likes: likes,
      },
    };
  }

  update(id: number, updateVideoDto: UpdateVideoDto) {
    return `This action updates a #${id} video`;
  }

  remove(id: number) {
    return `This action removes a #${id} video`;
  }
}
