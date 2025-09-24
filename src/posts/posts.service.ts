import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateVideoRepost } from './dto/create-video.repost';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../prisma/prisma.service';
import sharp from 'sharp';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { toSeconds, parse } from 'iso8601-duration';
import { ManagedFilesService } from '../managed-files/managed-files.service';
import { fileMetaToUrl, fileMetaToUrlFallback } from '../utils/utils';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly files: ManagedFilesService,
  ) {}

  async createVideoRepost(channelId: string, data: CreateVideoRepost) {
    // 1. validar la imagen validar dimensiones y compresion.
    let imageBuffer: Buffer;
    let img: sharp.Sharp;
    try {
      imageBuffer = Buffer.from(data.thumbnail, 'base64');
      img = sharp(imageBuffer);
      const meta = await img.metadata();
      console.log(meta);
      if (meta.format !== 'webp') {
        return new BadRequestException('Invalid image format.');
      }
      if (meta.hasAlpha) {
        return new BadRequestException('Transparency not allowed');
      }
      if (meta.width !== 1280 || meta.height !== 720) {
        return new BadRequestException('Image dimensions must be 1280x720');
      }
    } catch (err) {
      return new BadRequestException(err);
    }

    // 2. validar id de youtube con la api, obtengo duracion. ojo esta call no necesito snippet solo contentDetails.
    // todo cache calls to this api. for now volume is low for 10k daily limit.
    // omitted &part=snippet as im not interested in description for this post api.
    const result = await firstValueFrom(
      this.httpService.get(
        `https://youtube.googleapis.com/youtube/v3/videos?part=contentDetails&id=${data.youtubeVideoID}&key=${process.env.YOUTUBE_API_KEY}`,
      ),
    );
    if (result.status !== 200) {
      return new InternalServerErrorException(
        'Youtube Check Failed.',
        result.statusText,
      );
    }
    if (result.data.pageInfo.totalResults === 0) {
      return new BadRequestException(
        'Youtube Check Failed.',
        'Video does not exist or is private',
      );
    } else if (result.data.pageInfo.totalResults > 1) {
      return new BadRequestException(
        'Youtube Check Failed.',
        'Video id belongs to more than one video',
      );
    }
    // console.log(result.data);

    // upload image to bucket gets the id and url // todo figure out what happens when future steps fails.
    const file = await this.files.createManagedFile('img', imageBuffer);

    // todo hacer en frontend y preview al usuario.
    // await img
    //   .flatten({ background: '#ffffff' })
    //   .resize(1280, 720, {
    //     fit: 'fill',
    //   })
    //   .toFormat('webp', {
    //     quality: 70,
    //     effort: 6,
    //     smartSubsample: true,
    //     smartDeblock: true,
    //     preset: 'picture',
    //     force: true,
    //   })
    //   .toFile('test.webp');

    // convert to readable duration
    const duration: string = result.data.items[0].contentDetails.duration; // "PT10H1S" or "P2DT1S" or "PT15M43S", and or "PT6S"
    const readableDuration = this.formatYouTubeDuration(duration);
    // todo should I AI screen the title and description?
    // console.log(readableDuration);

    // 4. create post on to database.
    const createResult = await this.prisma.posts.create({
      include: {
        video: true,
      },
      data: {
        channelsId: channelId,
        title: data.title,
        type: 'Video',
        video: {
          create: {
            duration: readableDuration,
            description: data.description,
            mediaUrl: 'https://www.youtube.com/watch?v=' + data.youtubeVideoID,
            type: 'YoutubeRepost',
            thumbnailFileId: file.id,
          },
        },
      },
    });
    return {
      ...createResult,
      likes: 0,
      video: {
        ...createResult.video,
        views: 0,
        thumbnailUrl: file.url,
      },
    }; // return 201 created?
  }

  formatYouTubeDuration(duration) {
    const parsed = parse(duration);
    const totalSeconds = toSeconds(parsed);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number): string => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    } else {
      return `${minutes}:${pad(seconds)}`;
    }
  }

  findAll() {
    return `This action returns all posts`;
  }

  async findOne(id: string) {
    const data = await this.prisma.posts.findFirstOrThrow({
      select: {
        type: true,
        likes: true,
        title: true,
        createdAt: true,
        channels: {
          select: {
            avatarFile: true,
            name: true,
            id: true,
          },
        },
      },
    });
    //data.channels as { id: string; name: string; avatar: string }
    const cleanData = {
      type: data.type,
      title: data.title,
      likes: data.likes.toString(),
      createdAt: data.createdAt,
      channel: {
        id: data.channels.id,
        name: data.channels.name,
        avatar: fileMetaToUrlFallback(
          data.channels.avatarFile,
          'https://redacted.invalid/img/default_avatar.webp', // todo use .env to configure this
        ),
      },
    };

    switch (data.type) {
      case 'Video': {
        const video = await this.prisma.videoPost.findFirstOrThrow({
          where: {
            postId: id,
          },
          select: {
            mediaUrl: true,
            description: true,
            duration: true,
            views: true,
            type: true,
            thumbnailFile: {
              select: {
                prefix: true,
                id: true,
              },
            },
          },
        });
        cleanData['video'] = {
          mediaUrl: video.mediaUrl,
          description: video.description,
          duration: video.duration,
          thumbnail: fileMetaToUrl(video.thumbnailFile), // todo pass thumbnail with new format
          views: video.views.toString(),
          type: video.type,
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
