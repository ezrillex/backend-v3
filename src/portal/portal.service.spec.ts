import { Test, TestingModule } from '@nestjs/testing';
import { PortalService } from './portal.service';
import { PrismaService } from '../prisma/prisma.service';
import { fileMetaToUrlFallback } from '../utils/utils';

jest.mock('../utils/utils', () => ({
  fileMetaToUrlFallback: jest.fn((meta: any, fallback: string) =>
    meta ? `mock-url:${meta.prefix}/${meta.id}` : fallback,
  ),
}));

describe('PortalService', () => {
  let service: PortalService;

  const prismaMock: jest.Mocked<PrismaService> = {
    channels: {
      update: jest.fn(),
    },
    managedFile: {
      findUnique: jest.fn(),
    },
    posts: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortalService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<PortalService>(PortalService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should update channel name using Prisma with correct where and data', async () => {
    (prismaMock.channels.update as any).mockResolvedValue({
      id: 'c1',
      name: 'New Name',
    });

    const res = await service.updateChannel('c1', 'New Name');

    expect(prismaMock.channels.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.channels.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { name: 'New Name' },
    });
    expect(res).toEqual({ id: 'c1', name: 'New Name' });
  });

  it('should get avatar by id and map using fileMetaToUrlFallback', async () => {
    (prismaMock.managedFile.findUnique as any).mockResolvedValue({
      prefix: 'img',
      id: 'm1',
    });

    const result = await service.getAvatar('m1');

    expect(prismaMock.managedFile.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaMock.managedFile.findUnique).toHaveBeenCalledWith({
      where: { id: 'm1' },
    });
    expect(fileMetaToUrlFallback).toHaveBeenCalledTimes(1);
    expect(fileMetaToUrlFallback).toHaveBeenCalledWith(
      { prefix: 'img', id: 'm1' },
      'https://redacted.invalid/img/default_avatar.webp',
    );
    expect(result).toBe('mock-url:img/m1');
  });

  it('should compute stats: sum storage used and count hosted/youtube posts', async () => {
    (prismaMock.posts.findMany as any).mockResolvedValue([
      { kilobytes: 1000 },
      { kilobytes: 200 },
    ]);
    (prismaMock.posts.count as any)
      .mockResolvedValueOnce(2) // hosted videos count
      .mockResolvedValueOnce(5); // youtube repost count

    const stats = await service.getStats('chan-1');

    expect(prismaMock.posts.findMany).toHaveBeenCalledWith({
      where: { channelsId: 'chan-1' },
      select: { kilobytes: true },
    });
    expect(stats.storageUsed).toBe(1200);
    expect(stats.storageLimit).toBe(31_457_280);

    expect(prismaMock.posts.count).toHaveBeenNthCalledWith(1, {
      where: { channelsId: 'chan-1', video: { type: 'HostedVideo' } },
    });
    expect(prismaMock.posts.count).toHaveBeenNthCalledWith(2, {
      where: { channelsId: 'chan-1', video: { type: 'YoutubeRepost' } },
    });
    expect(stats.hostedVideosCount).toBe(2);
    expect(stats.youtubeRepostCount).toBe(5);
  });

  it('should return empty posts when page is greater than pageCount and not call findMany', async () => {
    (prismaMock.posts.count as any).mockResolvedValue(11); // page_size = 10 => pageCount = 2

    const result = await service.getPosts('chan-2', 3);

    expect(prismaMock.posts.count).toHaveBeenCalledWith({
      where: { channelsId: 'chan-2' },
    });
    expect(prismaMock.posts.findMany).not.toHaveBeenCalled();
    expect(result).toEqual({ posts: [], pageCount: 2 });
  });

  it('should paginate posts and map likes to string with correct query options', async () => {
    (prismaMock.posts.count as any).mockResolvedValue(23); // pageCount = 3
    (prismaMock.posts.findMany as any).mockResolvedValue([
      { id: 'p1', likes: 10n, createdAt: 'd', title: 't1', type: 'Video' },
      { id: 'p2', likes: 0n, createdAt: 'd', title: 't2', type: 'Text' },
    ]);

    const result = await service.getPosts('chan-9', 1);

    expect(prismaMock.posts.findMany).toHaveBeenCalledWith({
      where: { channelsId: 'chan-9' },
      omit: { channelsId: true },
      take: 10,
      skip: 10, // page 1 * page_size 10
      orderBy: { createdAt: 'desc' },
    });

    expect(result.pageCount).toBe(3);
    expect(result.posts).toEqual([
      { id: 'p1', likes: '10', createdAt: 'd', title: 't1', type: 'Video' },
      { id: 'p2', likes: '0', createdAt: 'd', title: 't2', type: 'Text' },
    ]);
  });
});
