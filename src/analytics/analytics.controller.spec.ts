import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;

  const analyticsMock = {
    likePost: jest.fn(),
    analyticsTrackViewPost: jest.fn(),
  } as unknown as jest.Mocked<AnalyticsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: analyticsMock,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
