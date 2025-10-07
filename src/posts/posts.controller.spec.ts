import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { SortBy } from './entities/sortBy.enum';
import { SortOrder } from './entities/sortOrder.enum';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin/admin.guard';

describe('PostsController', () => {
  let controller: PostsController;

  const mockPostsService = {
    createVideoRepost: jest.fn(),
    createVideoPost: jest.fn(),
    createTextPost: jest.fn(),
    submitHostedVideo: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  } as unknown as jest.Mocked<PostsService>;

  const allowGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: mockPostsService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(allowGuard)
      .overrideGuard(AdminGuard)
      .useValue(allowGuard);

    const module: TestingModule = await moduleBuilder.compile();

    controller = module.get<PostsController>(PostsController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate to createVideoRepost with channel id and body and return result', async () => {
    const req: any = { channel: { id: 'chan-1' } };
    const body: any = {
      title: 'A video',
      description: 'desc',
      youtubeVideoID: 'abc123',
      thumbnail: 'base64data',
    };
    const expected = { ok: true } as any;
    (mockPostsService.createVideoRepost as any).mockResolvedValue(expected);

    const result = await controller.createRepost(req, body);

    expect(mockPostsService.createVideoRepost).toHaveBeenCalledTimes(1);
    expect(mockPostsService.createVideoRepost).toHaveBeenCalledWith(
      'chan-1',
      body,
    );
    expect(result).toBe(expected);
  });

  it('should delegate to createVideoPost with channel id and body and return result', async () => {
    const req: any = { channel: { id: 'chan-2' } };
    const body: any = {
      title: 'Hosted video',
      description: 'hosted',
      thumbnail: 'base64',
    };
    const expected = { id: 'p1' } as any;
    (mockPostsService.createVideoPost as any).mockResolvedValue(expected);

    const result = await controller.createVideoPost(req, body);

    expect(mockPostsService.createVideoPost).toHaveBeenCalledTimes(1);
    expect(mockPostsService.createVideoPost).toHaveBeenCalledWith(
      'chan-2',
      body,
    );
    expect(result).toBe(expected);
  });

  it('should delegate to createTextPost with channel id and body and return result', async () => {
    const req: any = { channel: { id: 'chan-3' } };
    const body: any = { text: 'hello world' };
    const expected = { id: 'text-1' } as any;
    (mockPostsService.createTextPost as any).mockResolvedValue(expected);

    const result = await controller.createTextPost(req, body);

    expect(mockPostsService.createTextPost).toHaveBeenCalledTimes(1);
    expect(mockPostsService.createTextPost).toHaveBeenCalledWith(
      'chan-3',
      body,
    );
    expect(result).toBe(expected);
  });

  it('should normalize findAll query defaults and wrap type into array', async () => {
    const query: any = { type: 'Video' }; // missing page, sortBy, sortOrder
    const expected = [] as any[];
    (mockPostsService.findAll as any).mockResolvedValue(expected);

    const result = await controller.findAll(query);

    expect(mockPostsService.findAll).toHaveBeenCalledTimes(1);
    expect(mockPostsService.findAll).toHaveBeenCalledWith({
      page: 0,
      type: ['Video'],
      sortBy: SortBy.PublishedDate,
      sortOrder: SortOrder.DESC,
    });
    expect(result).toBe(expected);
  });

  it('should convert id to number on update and delegate call', async () => {
    const id = '42';
    const dto: any = { title: 'new title' };
    const expected = 'updated';
    (mockPostsService.update as any).mockResolvedValue(expected);

    const result = await controller.update(id, dto);

    expect(mockPostsService.update).toHaveBeenCalledTimes(1);
    expect(mockPostsService.update).toHaveBeenCalledWith(42, dto);
    expect(result).toBe(expected);
  });
});
