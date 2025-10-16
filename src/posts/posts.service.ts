import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateVideoRepost } from './dto/CreateVideoRepost';
import { UpdatePostDto } from './dto/UpdatePostDto';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { toSeconds, parse } from 'iso8601-duration';
import { ManagedFilesService } from '../managed-files/managed-files.service';
import { fileMetaToUrl, fileMetaToUrlFallback } from '../utils/utils';
import { CreateTextPost } from './dto/createTextPost';
import { CreateVideoPost } from './dto/CreateVideoPost';
import { SubmitHostedVideoPost } from './dto/SubmitHostedVideoPost';
import { GetAllVideosFilterSort } from './dto/GetAllVideosFilterSort';
import { SortBy } from './entities/sortBy.enum';
import { PostTypes, VideoTypes } from '@prisma/client';
import { validateImage } from '../utils/utils';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly files: ManagedFilesService,
  ) {}

  async submitHostedVideo(data: SubmitHostedVideoPost) {
    // convert seconds to duration string
    const duration = this.secondsToDurationString(data.duration);
    // get video by id
    const post = await this.prisma.posts.findUniqueOrThrow({
      where: {
        id: data.id,
      },
      select: {
        id: true,
        type: true,
        video: {
          select: {
            id: true,
            type: true,
          },
        },
      },
    });

    if (post.type !== PostTypes.Video) {
      throw new BadRequestException('post type is not video');
    }
    if (!post.video) {
      throw new InternalServerErrorException('Post video record is null');
    }
    if (post.video.type !== VideoTypes.HostedVideo) {
      throw new BadRequestException('video type is not hosted video');
    }

    // upload managed file torrent / get id
    const torrentFileBuffer = Buffer.from(data.torrent, 'base64');
    const torrentFileRecord = await this.files.createManagedFile(
      'wtt',
      torrentFileBuffer,
      false,
    );
    console.log(torrentFileRecord.url);

    // update video record with duration, torrent record id.
    const videoOutcome = await this.prisma.videoPost.update({
      where: {
        id: post.video.id,
      },
      data: {
        duration: duration,
        torrentFileId: torrentFileRecord.id,
      },
    });

    const postOutcome = await this.prisma.posts.update({
      where: {
        id: post.id,
      },
      data: {
        kilobytes: data.size,
      },
    });

    console.log(videoOutcome);
    console.log(postOutcome);
    return {
      ...postOutcome,
      views: postOutcome.views.toString(),
      likes: postOutcome.likes.toString(),

      video: videoOutcome,
    };
  }

  async createVideoRepost(channelId: string, data: CreateVideoRepost) {
    const image = await validateImage(data.thumbnail, 1280, 720);

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
    const image = await validateImage(data.thumbnail, 1280, 720);

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

  async findAll(params: GetAllVideosFilterSort) {
    const filterQuery = {};
    if (params.type.length > 0) {
      filterQuery['type'] = {
        in: params.type,
      };
    }

    if (params.channel) {
      filterQuery['channelsId'] = params.channel;
    }

    const orderQuery = {};
    switch (params.sortBy) {
      case SortBy.PublishedDate:
        orderQuery['publishedAt'] = params.sortOrder;
        break;
      case SortBy.Views:
        orderQuery['views'] = params.sortOrder;
        break;
      case SortBy.Likes:
        orderQuery['likes'] = params.sortOrder;
        break;
      default:
        break;
    }
    // todo determine if custom page size?
    const data = await this.prisma.posts.findMany({
      include: {
        video: true,
        image: true,
        text: true,
        imageText: true,
        audio: true,
        channels: {
          select: {
            id: true,
            name: true,
            avatarFile: true,
          },
        },
      },
      where: filterQuery,
      orderBy: orderQuery,
      take: 30,
      skip: params.page * 30,
    });

    return data.map((post) => {
      const clean = {
        id: post.id,
        type: post.type,
        title: post.title,
        views: post.views.toString(),
        likes: post.likes.toString(),
        publishedAt: post.publishedAt,
        channel: {
          id: post.channels.id,
          name: post.channels.name,
          avatar: fileMetaToUrlFallback(
            post.channels.avatarFile,
            'https://dev-vcris.25127928.xyz/img/default_avatar.webp',
          ),
        },
      };

      if (post.video) {
        clean['video'] = post.video;
      } else if (post.image) {
        clean['image'] = post.image;
      } else if (post.text) {
        clean['text'] = post.text;
      } else if (post.imageText) {
        clean['imageText'] = post.imageText;
      } else if (post.audio) {
        clean['audio'] = post.audio;
      }

      // items that do come but not included todo select only needed fileds.
      //"channelsId": "0199377c-ae49-7fb0-b72e-0c6d7d45ab29",
      //"published": false, // todo filter by this,
      //"kilobytes": 0,
      //"createdAt": "2025-09-27T01:32:40.745Z",

      return clean;
    });
  }

  async findOne(id: string) {
    const data = await this.prisma.posts.findFirstOrThrow({
      select: {
        type: true,
        views: true,
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
      views: data.views.toString(),
      createdAt: data.createdAt,
      channel: {
        id: data.channels.id,
        name: data.channels.name,
        avatar: fileMetaToUrlFallback(
          data.channels.avatarFile,
          'https://dev-vcris.25127928.xyz/img/default_avatar.webp', // todo use .env to configure this
        ),
      },
    };

    switch (data.type) {
      case PostTypes.Video:
        {
          const video = await this.prisma.videoPost.findFirstOrThrow({
            where: {
              postId: id,
            },
            select: {
              mediaUrl: true,
              description: true,
              duration: true,
              type: true,
              thumbnailFile: {
                select: {
                  prefix: true,
                  id: true,
                },
              },
              torrentFile: {
                select: {
                  prefix: true,
                  id: true,
                },
              },
              webseeds: {
                where: {
                  provider: {
                    enabled: true,
                  },
                },
                select: {
                  slug: true,
                  provider: {
                    select: {
                      basePath: true,
                    },
                  },
                },
              },
            },
          });

          switch (video.type) {
            case VideoTypes.YoutubeRepost:
              cleanData['video'] = {
                mediaUrl: video.mediaUrl,
                description: video.description,
                duration: video.duration,
                thumbnail: fileMetaToUrl(video.thumbnailFile), // todo pass thumbnail with new format
                type: video.type,
              };
              break;
            case VideoTypes.HostedVideo:
              if (!video.torrentFile) {
                throw new InternalServerErrorException(
                  'Requested hosted video does not have a .torrent file linked',
                );
              }
              cleanData['video'] = {
                description: video.description,
                duration: video.duration,
                thumbnail: fileMetaToUrl(video.thumbnailFile), // todo pass thumbnail with new format
                type: video.type,
                torrent: fileMetaToUrl(video.torrentFile),
                webseeds: video.webseeds.map((seed) => {
                  return seed.provider.basePath + seed.slug;
                }),
              };
          }
        }
        break;
    }

    return cleanData;
  }

  async update(
    id: string,
    requestDataToChange: UpdatePostDto,
    requestUserId: string,
  ) {
    // check post exists
    const originalData = await this.prisma.posts.findUniqueOrThrow({
      where: {
        id: id,
      },
      select: {
        id: true,
        published: true,
        type: true,
        channelsId: true,
        video: {
          select: {
            id: true,
            duration: true,
            type: true,
            torrentFileId: true,
          },
        },
        text: {
          select: {
            id: true,
          },
        },
      },
    });

    // todo check if logged in user is editing a post of HIS OWN channel.
    if (requestUserId !== originalData.channelsId) {
      throw new ForbiddenException(
        'Post does not belong to the user making the request',
      );
    }

    const newData = {};
    //figure out fields to update on post element
    if (requestDataToChange.title) {
      newData['title'] = requestDataToChange.title;
    }

    // if published false to true, runs checks if item is in publishable state and updates publish date.
    if (
      originalData.published !== requestDataToChange.isPublished &&
      requestDataToChange.isPublished
    ) {
      // has changed and is true? run publishable state checks, update published date.
      switch (
        originalData.type // for hosted videos check if torrent file and duration is present.
      ) {
        case PostTypes.Video:
          if (!originalData.video?.duration) {
            throw new InternalServerErrorException(
              'Post is not in publishable state: missing duration.',
            );
          }

          if (
            originalData.video?.type === VideoTypes.HostedVideo &&
            !originalData.video?.torrentFileId
          ) {
            throw new InternalServerErrorException(
              'Post is not in publishable state: hosted video file is not yet uploaded.',
            );
          }
          break;
      }
      // if no errors were triggered then continue with update.
      newData['published'] = true;
    } else if (
      originalData.published !== requestDataToChange.isPublished &&
      requestDataToChange.isPublished === false // do not catch undefined so explicit false comparison.
    ) {
      // has changed and is false?
      newData['published'] = false; // skip publishable checks and sets to not pub.
    }

    const updateResult = await this.prisma.posts.update({
      data: newData,
      where: {
        id: id,
      },
    });

    const relatedRecordUpdateOutcome = {};

    if (
      originalData.type === PostTypes.Text &&
      requestDataToChange.text &&
      requestDataToChange.text.text
    ) {
      if (!originalData.text) {
        throw new InternalServerErrorException(
          'Post of type text does not have a related text record.',
        );
      }
      relatedRecordUpdateOutcome['text'] = await this.prisma.textPost.update({
        where: {
          id: originalData.text.id,
        },
        data: { text: requestDataToChange.text.text },
      });
    }

    if (
      originalData.type === PostTypes.Video &&
      requestDataToChange.video &&
      requestDataToChange.video.description
    ) {
      if (!originalData.video) {
        throw new InternalServerErrorException(
          'Post of type text does not have a related text record.',
        );
      }
      relatedRecordUpdateOutcome['video'] = await this.prisma.videoPost.update({
        where: {
          id: originalData.video.id,
        },
        data: {
          description: requestDataToChange.video.description,
        },
      });
    }

    return {
      ...updateResult,
      likes: updateResult.likes.toString(),
      views: updateResult.views.toString(),
      ...relatedRecordUpdateOutcome,
    };
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
