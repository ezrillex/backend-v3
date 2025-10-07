import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ManagedFilesService } from '../managed-files/managed-files.service';
import { SortBy } from './entities/sortBy.enum';

// Dynamically controlled metadata for sharp mock
const mockMeta: any = {
  format: 'webp',
  hasAlpha: false,
  width: 1280,
  height: 720,
};

// Mock sharp to avoid processing real images
jest.mock('sharp', () => {
  return () => ({
    metadata: jest.fn(async () => mockMeta),
  });
});

describe('PostsService', () => {
  let service: PostsService;
  let prisma: any;
  let http: any;
  let files: any;

  beforeEach(async () => {
    prisma = {
      posts: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirstOrThrow: jest.fn(),
        update: jest.fn(),
      },
      videoPost: {
        findFirstOrThrow: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
    };

    http = {
      get: jest.fn(),
    };

    files = {
      createManagedFile: jest.fn(),
    };

    // reset sharp mock metadata defaults before each test
    mockMeta.format = 'webp';
    mockMeta.hasAlpha = false;
    mockMeta.width = 1280;
    mockMeta.height = 720;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: prisma },
        { provide: HttpService, useValue: http },
        { provide: ManagedFilesService, useValue: files },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // validateImage edge cases
  it('should reject non-webp images in validateImage', async () => {
    mockMeta.format = 'jpeg';
    const res = await service.validateImage('AAAA');
    expect(res).toBeInstanceOf(BadRequestException);
  });

  it('should reject images with alpha channel', async () => {
    mockMeta.hasAlpha = true;
    const res = await service.validateImage('AAAA');
    expect(res).toBeInstanceOf(BadRequestException);
  });

  it('should reject images with wrong dimensions', async () => {
    mockMeta.width = 1920;
    mockMeta.height = 1080;
    const res = await service.validateImage('AAAA');
    expect(res).toBeInstanceOf(BadRequestException);
  });

  // secondsToDurationString
  it('should format seconds to M:SS when under an hour', () => {
    expect(service.secondsToDurationString(59)).toBe('0:59');
    expect(service.secondsToDurationString(75)).toBe('1:15');
    expect(service.secondsToDurationString(599)).toBe('9:59');
  });

  it('should format seconds to H:MM:SS when one hour or more', () => {
    expect(service.secondsToDurationString(3600)).toBe('1:00:00');
    expect(service.secondsToDurationString(3661)).toBe('1:01:01');
    expect(service.secondsToDurationString(7322)).toBe('2:02:02');
  });

  // formatYouTubeDuration
  it('should format ISO8601 YouTube durations', () => {
    expect(service.formatYouTubeDuration('PT15M43S')).toBe('15:43');
    expect(service.formatYouTubeDuration('PT6S')).toBe('0:06');
  });

  // createVideoPost happy path
  it('should create a hosted video post with derived properties', async () => {
    const fileRecord = {
      id: 'file-1',
      url: 'https://cdn.example.com/img/file-1.webp',
    };
    files.createManagedFile.mockResolvedValue(fileRecord);

    const created = {
      id: 'post-1',
      title: 'My Post',
      type: 'Video',
      publishedAt: new Date('2025-01-01T00:00:00Z'),
      channelsId: 'chan-1',
      video: {
        id: 'video-1',
        description: 'desc',
        type: 'HostedVideo',
        thumbnailFileId: 'file-1',
      },
      views: 0,
      likes: 0,
    };

    prisma.posts.create.mockResolvedValue(created);

    const input = {
      title: 'My Post',
      description: 'desc',
      thumbnail: 'AAAA',
    } as any; // CreateVideoPost

    const result = await service.createVideoPost('chan-1', input);

    // Ensure dependencies were called as expected
    expect(files.createManagedFile).toHaveBeenCalledWith(
      'img',
      expect.any(Buffer),
      true,
    );
    expect(prisma.posts.create).toHaveBeenCalledWith({
      include: { video: true },
      data: expect.objectContaining({
        channelsId: 'chan-1',
        title: 'My Post',
        type: 'Video',
        video: {
          create: expect.objectContaining({
            description: 'desc',
            type: 'HostedVideo',
            thumbnailFileId: 'file-1',
          }),
        },
      }),
    });

    // Validate transformed response
    expect(result.likes).toBe(0);
    expect(result.video.views).toBe(0);
    expect(result.video.thumbnailUrl).toBe(fileRecord.url);
  });

  it('should return BadRequestException when image validation fails in createVideoPost', async () => {
    mockMeta.width = 1; // force invalid

    const res = await service.createVideoPost('chan-1', {
      title: 'X',
      description: 'Y',
      thumbnail: 'AAAA',
    } as any);

    expect(res).toBeInstanceOf(BadRequestException);
    expect(files.createManagedFile).not.toHaveBeenCalled();
    expect(prisma.posts.create).not.toHaveBeenCalled();
  });

  // createVideoRepost flows
  it('should create a YouTube repost with computed duration and thumbnail', async () => {
    const rx = require('rxjs');
    jest.spyOn(rx, 'firstValueFrom').mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: {
        pageInfo: { totalResults: 1 },
        items: [{ contentDetails: { duration: 'PT15M43S' } }],
      },
    });

    const fileRecord = { id: 'thumb-1', url: 'https://cdn/x.webp' };
    files.createManagedFile.mockResolvedValue(fileRecord);

    prisma.posts.create.mockResolvedValue({
      id: 'p1',
      title: 'T',
      type: 'Video',
      video: {
        id: 'vid1',
        description: 'd',
        type: 'YoutubeRepost',
        thumbnailFileId: 'thumb-1',
      },
    });

    const result: any = await service.createVideoRepost('chan-9', {
      title: 'T',
      description: 'd',
      youtubeVideoID: 'abc',
      thumbnail: 'AAAA',
    } as any);

    expect(files.createManagedFile).toHaveBeenCalledWith(
      'img',
      expect.any(Buffer),
      true,
    );
    expect(prisma.posts.create).toHaveBeenCalled();

    expect(result.likes).toBe(0);
    expect(result.video.views).toBe(0);
    expect(result.video.thumbnailUrl).toBe('https://cdn/x.webp');
  });

  it('should return InternalServerErrorException when YouTube API fails', async () => {
    const rx = require('rxjs');
    jest
      .spyOn(rx, 'firstValueFrom')
      .mockResolvedValue({ status: 500, statusText: 'ERR' });

    const res = await service.createVideoRepost('chan-9', {
      title: 'T',
      description: 'd',
      youtubeVideoID: 'abc',
      thumbnail: 'AAAA',
    } as any);

    expect(res).toBeInstanceOf(InternalServerErrorException);
    expect(files.createManagedFile).not.toHaveBeenCalled();
    expect(prisma.posts.create).not.toHaveBeenCalled();
  });

  it('should return BadRequestException when YouTube video not found', async () => {
    const rx = require('rxjs');
    jest.spyOn(rx, 'firstValueFrom').mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: { pageInfo: { totalResults: 0 } },
    });

    const res = await service.createVideoRepost('chan-9', {
      title: 'T',
      description: 'd',
      youtubeVideoID: 'abc',
      thumbnail: 'AAAA',
    } as any);

    expect(res).toBeInstanceOf(BadRequestException);
  });

  it('should return BadRequestException when YouTube returns multiple results', async () => {
    const rx = require('rxjs');
    jest.spyOn(rx, 'firstValueFrom').mockResolvedValue({
      status: 200,
      statusText: 'OK',
      data: { pageInfo: { totalResults: 2 } },
    });

    const res = await service.createVideoRepost('chan-9', {
      title: 'T',
      description: 'd',
      youtubeVideoID: 'abc',
      thumbnail: 'AAAA',
    } as any);

    expect(res).toBeInstanceOf(BadRequestException);
  });

  // createTextPost
  it('should create text post and return likes defaulted to 0', async () => {
    prisma.posts.create.mockResolvedValue({
      id: 'tx1',
      type: 'Text',
      text: { id: 't1', text: 'hello' },
      likes: 0,
    });

    const res: any = await service.createTextPost('chan-1', {
      text: 'hello',
    } as any);

    expect(prisma.posts.create).toHaveBeenCalledWith({
      include: { text: true },
      data: {
        channelsId: 'chan-1',
        type: 'Text',
        text: { create: { text: 'hello' } },
      },
    });
    expect(res.likes).toBe(0);
  });

  // submitHostedVideo
  it('should submit hosted video, upload torrent, and update post size', async () => {
    prisma.videoPost.findUniqueOrThrow.mockResolvedValue({ id: 'v1' });
    files.createManagedFile.mockResolvedValue({
      id: 'tor1',
      url: 'https://cdn/tor1.torrent',
    });

    prisma.videoPost.update.mockResolvedValue({
      id: 'v1',
      duration: '1:01:01',
      torrentFileId: 'tor1',
      post: { id: 'p1' },
    });

    prisma.posts.update.mockResolvedValue({
      id: 'p1',
      views: 3n,
      likes: 4n,
      kilobytes: 2048,
    });

    const res: any = await service.submitHostedVideo({
      id: 'v1',
      duration: 3661,
      torrent: Buffer.from('filecontent').toString('base64'),
      size: 2048,
    } as any);

    expect(files.createManagedFile).toHaveBeenCalledWith(
      'wtt',
      expect.any(Buffer),
      false,
    );
    const calledBuffer = (files.createManagedFile as jest.Mock).mock
      .calls[0][1];
    expect(Buffer.isBuffer(calledBuffer)).toBe(true);

    expect(prisma.videoPost.update).toHaveBeenCalledWith({
      where: { id: 'v1' },
      data: { duration: '1:01:01', torrentFileId: 'tor1' },
      include: { post: { select: { id: true } } },
    });

    expect(prisma.posts.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { kilobytes: 2048 },
    });

    expect(res.post.views).toBe('3');
    expect(res.post.likes).toBe('4');
  });

  // findAll mapping and filters
  it('should map results with stringified counts and avatar fallback in findAll', async () => {
    const post = {
      id: 'p1',
      type: 'Video',
      title: 'T',
      views: 123,
      likes: 45,
      publishedAt: new Date('2025-01-01T00:00:00Z'),
      video: { id: 'v1' },
      image: null,
      text: null,
      imageText: null,
      audio: null,
      channels: {
        id: 'c1',
        name: 'C',
        avatarFile: null,
      },
    } as any;

    prisma.posts.findMany.mockResolvedValue([post]);

    const result = await service.findAll({
      page: 0,
      type: [],
      sortBy: SortBy.PublishedDate,
      sortOrder: 'desc' as any,
      channel: undefined,
    });

    expect(result).toHaveLength(1);
    const item = result[0];
    expect(item.id).toBe('p1');
    expect(item.type).toBe('Video');
    expect(item.title).toBe('T');
    expect(item.views).toBe('123');
    expect(item.likes).toBe('45');
    expect(item.publishedAt).toEqual(new Date('2025-01-01T00:00:00Z'));
    expect(item.channel).toEqual({
      id: 'c1',
      name: 'C',
      avatar: 'https://dev-vcris.25127928.xyz/img/default_avatar.webp',
    });
    expect(item.video).toEqual({ id: 'v1' });
  });

  it('should apply filters and sorting in findAll', async () => {
    prisma.posts.findMany.mockResolvedValue([]);

    await service.findAll({
      page: 2,
      type: ['Video'],
      sortBy: SortBy.Views,
      sortOrder: 'asc' as any,
      channel: 'chan-88',
    });

    expect(prisma.posts.findMany).toHaveBeenCalledWith({
      include: expect.any(Object),
      where: { type: { in: ['Video'] }, channelsId: 'chan-88' },
      orderBy: { views: 'asc' },
      take: 30,
      skip: 60,
    });
  });

  // findOne mapping
  it('should find one post and include video details and channel avatar fallback', async () => {
    prisma.posts.findFirstOrThrow.mockResolvedValue({
      type: 'Video',
      views: 7n,
      likes: 8n,
      title: 'Z',
      createdAt: new Date('2024-01-01'),
      channels: { avatarFile: null, name: 'CC', id: 'cx' },
    });

    prisma.videoPost.findFirstOrThrow.mockResolvedValue({
      mediaUrl: 'http://y',
      description: 'desc',
      duration: '1:00',
      type: 'YoutubeRepost',
      thumbnailFile: { prefix: 'img', id: 't1' },
    });

    const result: any = await service.findOne('pid');

    expect(result.title).toBe('Z');
    expect(result.likes).toBe('8');
    expect(result.views).toBe('7');
    expect(result.channel.avatar).toBe(
      'https://dev-vcris.25127928.xyz/img/default_avatar.webp',
    );
    expect(result.video.thumbnail).toBe(
      'https://dev-vcris.25127928.xyz/img/t1.webp',
    );
  });
});
