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
import { CreateTextPost } from './dto/createTextPost';
import { CreateVideoPost } from './dto/CreateVideoPost';
import { SubmitHostedVideoPost } from './dto/SubmitHostedVideoPost';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly files: ManagedFilesService,
  ) {}

  async submitHostedVideo(data: SubmitHostedVideoPost) {
    // todo implement this
    // convert seconds to duration string
    const duration = this.secondsToDurationString(data.duration);
    // get video by id
    const record = await this.prisma.videoPost.findUniqueOrThrow({
      where: {
        id: data.id,
      },
    });
    console.log(record);
    // upload managed file torrent / get id
    const torrentFileBuffer = Buffer.from(data.torrent, 'base64');
    const torrentFileRecord = await this.files.createManagedFile(
      'wtt',
      torrentFileBuffer,
      false,
    );
    console.log(torrentFileRecord.url);

    // update video record with duration, torrent record id.
    const outcome = await this.prisma.videoPost.update({
      where: {
        id: data.id,
      },
      data: {
        duration: duration,
        torrentFileId: torrentFileRecord.id,
      },
    });
    console.log(outcome);
    return {
      ...outcome,
      views: outcome.views.toString(),
    };
  }

  async validateImage(base64: string) {
    // 1. validar la imagen validar dimensiones y compresion.
    let imageBuffer: Buffer;
    let img: sharp.Sharp;
    try {
      imageBuffer = Buffer.from(base64, 'base64');
      img = sharp(imageBuffer);
      const meta = await img.metadata();
      if (meta.format !== 'webp') {
        return new BadRequestException('Invalid image format.');
      }
      if (meta.hasAlpha) {
        return new BadRequestException('Transparency not allowed');
      }
      if (meta.width !== 1280 || meta.height !== 720) {
        return new BadRequestException('Image dimensions must be 1280x720');
      }
      // console.log(imageBuffer.length); size checked by nestjs rejecting 1mb plus requests.
    } catch (err) {
      return new BadRequestException(err);
    }
    return imageBuffer;
  }

  async createVideoRepost(channelId: string, data: CreateVideoRepost) {
    const image = await this.validateImage(data.thumbnail);
    if (image instanceof BadRequestException) {
      return image;
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
    const file = await this.files.createManagedFile('img', image, true);

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

  async createVideoPost(channelId: string, data: CreateVideoPost) {
    const image = await this.validateImage(data.thumbnail);
    if (image instanceof BadRequestException) {
      return image;
    }

    // upload image to bucket gets the id and url // todo figure out what happens when future steps fails.
    const file = await this.files.createManagedFile('img', image, true);

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
            description: data.description,
            type: 'HostedVideo',
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
    }; // return 201 created? // todo frontend show 'upload code' which is uuid of post. link to gform
  }

  async createTextPost(channelId: string, data: CreateTextPost) {
    // 4. create post on to database.
    const createResult = await this.prisma.posts.create({
      include: {
        text: true,
      },
      data: {
        channelsId: channelId,
        type: 'Text',
        text: {
          create: {
            text: data.text,
          },
        },
      },
    });
    return {
      ...createResult,
      likes: 0,
    }; // return 201 created?
  }

  secondsToDurationString(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secondsRemainder = seconds % 60;

    const pad = (n: number): string => n.toString().padStart(2, '0');

    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(secondsRemainder)}`;
    } else {
      return `${minutes}:${pad(secondsRemainder)}`;
    }
  }

  formatYouTubeDuration(duration) {
    const parsed = parse(duration);
    const totalSeconds = toSeconds(parsed);

    return this.secondsToDurationString(totalSeconds);
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
