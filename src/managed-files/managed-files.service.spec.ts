import { Test, TestingModule } from '@nestjs/testing';
import { ManagedFilesService } from './managed-files.service';
import { PrismaService } from '../prisma/prisma.service';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';

describe('ManagedFilesService', () => {
  let service: ManagedFilesService;

  const prismaMock: any = {
    managedFile: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>;

  const makeBuffer = (str: string) => Buffer.from(str, 'utf8');
  const sha256 = (buf: Buffer) =>
    crypto.createHash('sha256').update(buf).digest('hex');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManagedFilesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ManagedFilesService>(ManagedFilesService);
    // Inject a fake S3 client
    (service as any).s3 = { send: jest.fn() };

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reuse existing file and not upload when duplicate hash is found', async () => {
    const file = makeBuffer('duplicate');
    const hash = sha256(file);

    prismaMock.managedFile.findUnique.mockResolvedValue({
      id: 'm1',
      prefix: 'img',
    });

    const result = await service.createManagedFile('img', file);

    expect(prismaMock.managedFile.findUnique).toHaveBeenCalledWith({
      where: { hash },
      select: { id: true, prefix: true },
    });
    expect(prismaMock.managedFile.create).not.toHaveBeenCalled();
    expect((service as any).s3.send).not.toHaveBeenCalled();

    expect(result).toEqual({
      id: 'm1',
      url: 'https://redacted.invalid/img/m1.webp',
    });
  });

  it('should create a new record and upload image with correct key and content type', async () => {
    const file = makeBuffer('new-image');

    prismaMock.managedFile.findUnique.mockResolvedValue(null);
    prismaMock.managedFile.create.mockResolvedValue({ id: 'new1' });
    (service as any).s3.send.mockResolvedValue({
      $metadata: { httpStatusCode: 201 },
    });

    const result = await service.createManagedFile('img', file);

    expect(prismaMock.managedFile.create).toHaveBeenCalledWith({
      select: { id: true },
      data: { hash: sha256(file), prefix: 'img' },
    });

    const callArg = (service as any).s3.send.mock.calls[0][0];
    expect(callArg).toBeInstanceOf(PutObjectCommand);
    // AWS SDK v3 commands expose the input on `input`
    expect(callArg.input).toMatchObject({
      Bucket: 'dev-vcris',
      Key: 'img/new1.webp',
      Body: file,
      ContentType: 'image/webp',
    });
    expect(callArg.input).not.toHaveProperty('CacheControl');

    expect(result).toEqual({
      id: 'new1',
      url: 'https://redacted.invalid/img/new1.webp',
    });
  });

  it('should include CacheControl header when cache is true', async () => {
    const file = makeBuffer('cache-image');

    prismaMock.managedFile.findUnique.mockResolvedValue(null);
    prismaMock.managedFile.create.mockResolvedValue({ id: 'cache1' });
    (service as any).s3.send.mockResolvedValue({
      $metadata: { httpStatusCode: 201 },
    });

    await service.createManagedFile('img', file, true);

    const cmd = (service as any).s3.send.mock.calls[0][0];
    expect(cmd.input.CacheControl).toBe('public, max-age=31536000, immutable');
  });

  it('should rollback and throw when S3 returns non-201 status code', async () => {
    const file = makeBuffer('fail-upload');

    prismaMock.managedFile.findUnique.mockResolvedValue(null);
    prismaMock.managedFile.create.mockResolvedValue({ id: 'bad1' });
    (service as any).s3.send.mockResolvedValue({
      $metadata: { httpStatusCode: 500 },
    });

    await expect(service.createManagedFile('wtt', file)).rejects.toThrow(
      'Torrent Upload Failed',
    );

    expect(prismaMock.managedFile.delete).toHaveBeenCalledWith({
      where: { id: 'bad1' },
    });
  });

  it('should handle wtt prefix using .torrent extension and correct mime type', async () => {
    const file = makeBuffer('torrent-file');

    prismaMock.managedFile.findUnique.mockResolvedValue(null);
    prismaMock.managedFile.create.mockResolvedValue({ id: 'tor1' });
    (service as any).s3.send.mockResolvedValue({
      $metadata: { httpStatusCode: 201 },
    });

    const res = await service.createManagedFile('wtt', file);

    const cmd = (service as any).s3.send.mock.calls[0][0];
    expect(cmd.input).toMatchObject({
      Key: 'wtt/tor1.torrent',
      ContentType: 'application/x-bittorrent',
    });

    expect(res).toEqual({
      id: 'tor1',
      url: 'https://redacted.invalid/wtt/tor1.torrent',
    });
  });
});
