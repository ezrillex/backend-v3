import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

jest.mock('./utils/utils', () => ({
  fileMetaToUrl: jest.fn(() => 'thumb-url'),
  fileMetaToUrlFallback: jest.fn((meta: any, fallback: string) =>
    meta ? 'avatar-url-from-meta' : fallback,
  ),
}));

import { fileMetaToUrl, fileMetaToUrlFallback } from './utils/utils';

describe('AppService', () => {
  let service: AppService;

  const prismaMock: jest.Mocked<PrismaService> = {
    posts: {
      findMany: jest.fn(),
    },
    channels: {
      findMany: jest.fn(),
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = module.get<AppService>(AppService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call Prisma with correct selections and handle empty results', async () => {
    (prismaMock.posts.findMany as any).mockResolvedValue([]);
    (prismaMock.channels.findMany as any).mockResolvedValue([]);

    const res = await service.getHomePage();

    expect(prismaMock.posts.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        type: true,
        title: true,
        views: true,
        channels: { select: { id: true, name: true, avatarFile: true } },
        video: { select: { duration: true, thumbnailFile: true } },
        image: true,
        text: { select: { text: true } },
        imageText: true,
        audio: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 11,
    });

    expect(prismaMock.channels.findMany).toHaveBeenCalledWith({
      include: {
        avatarFile: true,
        _count: {
          select: { posts: true },
        },
      },
      take: 5,
    });

    expect(res).toEqual({ latest: [], channels: [] });
  });

  it('should map video posts with string views and thumbnail via fileMetaToUrl', async () => {
    (prismaMock.posts.findMany as any).mockResolvedValue([
      {
        id: 'p1',
        type: 'Video',
        title: 'T',
        views: 123n,
        createdAt: new Date('2024-01-01'),
        channels: {
          id: 'c1',
          name: 'Ch',
          avatarFile: { prefix: 'img', id: 'a1' },
        },
        video: { duration: '1:20', thumbnailFile: { prefix: 'img', id: 't1' } },
        image: null,
        text: null,
        imageText: null,
        audio: null,
      },
    ]);
    (prismaMock.channels.findMany as any).mockResolvedValue([]);

    const res = await service.getHomePage();

    expect(fileMetaToUrl).toHaveBeenCalled();
    expect(fileMetaToUrlFallback).toHaveBeenCalled();

    expect(res.latest[0]).toEqual({
      id: 'p1',
      type: 'Video',
      title: 'T',
      views: '123',
      createdAt: new Date('2024-01-01'),
      channel: { id: 'c1', name: 'Ch', avatar: 'avatar-url-from-meta' },
      video: { duration: '1:20', thumbnail: 'thumb-url' },
    });
  });

  it('should map text posts and use default avatar when avatarFile is null', async () => {
    (prismaMock.posts.findMany as any).mockResolvedValue([
      {
        id: 'p2',
        type: 'Text',
        title: 'Hello',
        views: 0n,
        createdAt: new Date('2024-01-02'),
        channels: { id: 'c2', name: 'Chan2', avatarFile: null },
        video: null,
        image: null,
        text: { text: 'lorem' },
        imageText: null,
        audio: null,
      },
    ]);
    (prismaMock.channels.findMany as any).mockResolvedValue([]);

    const res = await service.getHomePage();

    expect(res.latest[0]).toEqual({
      id: 'p2',
      type: 'Text',
      title: 'Hello',
      views: '0',
      createdAt: new Date('2024-01-02'),
      channel: {
        id: 'c2',
        name: 'Chan2',
        avatar: 'https://redacted.invalid/img/default_avatar.webp',
      },
      text: { text: 'lorem' },
    });
  });

  it('should map channels list with avatar and posts count', async () => {
    (prismaMock.posts.findMany as any).mockResolvedValue([]);
    (prismaMock.channels.findMany as any).mockResolvedValue([
      {
        id: 'c3',
        name: 'C3',
        avatarFile: { prefix: 'img', id: 'a3' },
        _count: { posts: 7 },
      },
    ]);

    const res = await service.getHomePage();

    expect(res.channels).toEqual([
      {
        id: 'c3',
        name: 'C3',
        avatar: 'avatar-url-from-meta',
        postsCount: 7,
      },
    ]);
  });

  it('should log memory usage summary in system()', () => {
    const original = process.memoryUsage;
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    // Stub memory usage
    // used = 100MB, total = 200MB
    // heapUsage = 50.00%, systemUsage = 19.53%
    // usedMB/totalMB formatted with 2 decimals
    (process as any).memoryUsage = () => ({
      heapUsed: 100_000_000,
      heapTotal: 200_000_000,
    });

    service.system();

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toBe(
      'Heap Usage: 50.00% (100.00/200.00 MB) | Memory Usage: 19.53% (100.00/512 MB)',
    );

    logSpy.mockRestore();
    (process as any).memoryUsage = original;
  });
});
