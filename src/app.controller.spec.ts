import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const appServiceMock = {
    getHomePage: jest.fn(),
  } as unknown as jest.Mocked<AppService>;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appServiceMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    jest.clearAllMocks();
  });

  describe('getHome', () => {
    it('should return home page payload from service', async () => {
      const payload = { latest: [], channels: [] } as any;
      (appServiceMock.getHomePage as any).mockResolvedValue(payload);

      const result = await appController.getHome();

      expect(appServiceMock.getHomePage).toHaveBeenCalledTimes(1);
      expect(result).toBe(payload);
    });
  });
});
