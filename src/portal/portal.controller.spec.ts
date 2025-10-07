import { Test, TestingModule } from '@nestjs/testing';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { AuthGuard } from '../auth/auth.guard';

describe('PortalController', () => {
  let controller: PortalController;

  const mockPortalService = {
    getAvatar: jest.fn(),
    updateChannel: jest.fn(),
    getPosts: jest.fn(),
    getStats: jest.fn(),
  } as unknown as jest.Mocked<PortalService>;

  const allowGuard = { canActivate: jest.fn().mockReturnValue(true) };

  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [PortalController],
      providers: [
        {
          provide: PortalService,
          useValue: mockPortalService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(allowGuard);

    const module: TestingModule = await moduleBuilder.compile();

    controller = module.get<PortalController>(PortalController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return channel name and avatar for getChannel, delegating to service with avatarFileId', async () => {
    const req: any = {
      channel: { name: 'My Channel', avatarFileId: 'file-1' },
    };
    (mockPortalService.getAvatar as any).mockResolvedValue('http://avatar');

    const result = await controller.getChannel(req);

    expect(mockPortalService.getAvatar).toHaveBeenCalledTimes(1);
    expect(mockPortalService.getAvatar).toHaveBeenCalledWith('file-1');
    expect(result).toEqual({ name: 'My Channel', avatar: 'http://avatar' });
  });

  it('should pass null avatarFileId to service and still return correct shape for getChannel', async () => {
    const req: any = { channel: { name: 'Anon', avatarFileId: null } };
    (mockPortalService.getAvatar as any).mockResolvedValue('http://default');

    const result = await controller.getChannel(req);

    expect(mockPortalService.getAvatar).toHaveBeenCalledWith(null);
    expect(result).toEqual({ name: 'Anon', avatar: 'http://default' });
  });

  it('should call updateChannel with channel id and new name and return no content', async () => {
    const req: any = { channel: { id: 'chan-1' } };
    const body: any = { newChannelName: 'New Name' };
    (mockPortalService.updateChannel as any).mockResolvedValue({});

    const result = await controller.updateChannel(req, body);

    expect(mockPortalService.updateChannel).toHaveBeenCalledTimes(1);
    expect(mockPortalService.updateChannel).toHaveBeenCalledWith(
      'chan-1',
      'New Name',
    );
    expect(result).toBeUndefined();
  });

  it('should delegate getPosts to service with channel id and page and return result', async () => {
    const req: any = { channel: { id: 'chan-2' } };
    const query: any = { page: 3 };
    const expected = { posts: [{ id: 'p1' }], pageCount: 5 };
    (mockPortalService.getPosts as any).mockResolvedValue(expected);

    const result = await controller.getPosts(req, query);

    expect(mockPortalService.getPosts).toHaveBeenCalledTimes(1);
    expect(mockPortalService.getPosts).toHaveBeenCalledWith('chan-2', 3);
    expect(result).toBe(expected);
  });

  it('should delegate getStats to service with channel id and return result', async () => {
    const req: any = { channel: { id: 'chan-3' } };
    const expected = {
      storageUsed: 123,
      storageLimit: 31457280,
      hostedVideosCount: 2,
      youtubeRepostCount: 1,
    };
    (mockPortalService.getStats as any).mockResolvedValue(expected);

    const result = await controller.getStats(req);

    expect(mockPortalService.getStats).toHaveBeenCalledTimes(1);
    expect(mockPortalService.getStats).toHaveBeenCalledWith('chan-3');
    expect(result).toBe(expected);
  });
});
